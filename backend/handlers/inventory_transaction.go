package handlers

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

func GetInventoryTransactions(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT t.id, t.material_id, t.transaction_type, t.quantity,
		       t.researcher_id, t.performed_by, t.notes, t.created_at
		FROM inventory_transactions t
		JOIN materials m ON m.id = t.material_id
		WHERE $1::boolean OR m.laboratory_id = ANY($2::integer[])
		ORDER BY t.created_at DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch inventory transactions"})
	}
	defer rows.Close()

	transactions := make([]models.InventoryTransaction, 0)
	for rows.Next() {
		var transaction models.InventoryTransaction
		if err := rows.Scan(
			&transaction.ID,
			&transaction.MaterialID,
			&transaction.TransactionType,
			&transaction.Quantity,
			&transaction.ResearcherID,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read transaction data"})
		}
		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading transactions"})
	}
	return c.JSON(transactions)
}

func CreateInventoryTransaction(c fiber.Ctx) error {
	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine authenticated user access"})
	}

	var transaction models.InventoryTransaction
	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if transaction.MaterialID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Material ID is required"})
	}
	if transaction.Quantity <= 0 || math.IsNaN(transaction.Quantity) || math.IsInf(transaction.Quantity, 0) {
		return c.Status(400).JSON(fiber.Map{"error": "Transaction quantity must be a valid positive number"})
	}

	transaction.TransactionType = strings.ToUpper(strings.TrimSpace(transaction.TransactionType))
	transaction.PerformedBy = strings.TrimSpace(transaction.PerformedBy)

	if transaction.TransactionType != "USE" && transaction.TransactionType != "RESTOCK" {
		return c.Status(400).JSON(fiber.Map{"error": "Transaction type must be USE or RESTOCK"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start database transaction"})
	}
	defer tx.Rollback(ctx)

	var laboratoryID int
	var currentQuantity float64

	err = tx.QueryRow(ctx, `
		SELECT laboratory_id, quantity
		FROM materials
		WHERE id = $1
		FOR UPDATE
	`, transaction.MaterialID).Scan(&laboratoryID, &currentQuantity)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{"error": "Material not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve material"})
	}
	if !scopeAllowsLaboratory(scope, laboratoryID) {
		return laboratoryAccessDenied(c)
	}

	if transaction.ResearcherID != nil {
		if *transaction.ResearcherID <= 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid researcher ID"})
		}

		err = tx.QueryRow(ctx, `
			SELECT r.full_name
			FROM researchers r
			WHERE r.id = $1
			  AND r.status = 'ACTIVE'
			  AND (
				  r.primary_laboratory_id = $2
				  OR EXISTS (
					  SELECT 1
					  FROM researcher_laboratories rl
					  WHERE rl.researcher_id = r.id
					    AND rl.laboratory_id = $2
				  )
			  )
		`, *transaction.ResearcherID, laboratoryID).Scan(&transaction.PerformedBy)

		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(403).JSON(fiber.Map{
				"error": "Researcher is not active or is not assigned to this laboratory",
			})
		}
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to verify researcher"})
		}
	} else if transaction.PerformedBy == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Researcher ID or performed by name is required"})
	}

	newQuantity := currentQuantity
	if transaction.TransactionType == "USE" {
		if transaction.Quantity > currentQuantity {
			return c.Status(400).JSON(fiber.Map{"error": "Insufficient material quantity"})
		}
		newQuantity -= transaction.Quantity
	} else {
		newQuantity += transaction.Quantity
		if math.IsInf(newQuantity, 0) {
			return c.Status(400).JSON(fiber.Map{"error": "Updated material quantity is too large"})
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE materials SET quantity = $1 WHERE id = $2
	`, newQuantity, transaction.MaterialID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update material quantity"})
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO inventory_transactions (
			material_id, transaction_type, quantity,
			researcher_id, performed_by, notes, actor_user_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`,
		transaction.MaterialID,
		transaction.TransactionType,
		transaction.Quantity,
		transaction.ResearcherID,
		transaction.PerformedBy,
		transaction.Notes,
		actorID,
	).Scan(&transaction.ID, &transaction.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create inventory transaction"})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save inventory transaction"})
	}
	return c.Status(201).JSON(transaction)
}
