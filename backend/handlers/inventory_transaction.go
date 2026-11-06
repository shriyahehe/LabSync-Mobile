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

// GetInventoryTransactions returns all inventory transactions.
func GetInventoryTransactions(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, material_id, transaction_type, quantity,
		       researcher_id, performed_by, notes, created_at
		FROM inventory_transactions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch inventory transactions",
		})
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
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read transaction data",
			})
		}

		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading transactions",
		})
	}

	return c.JSON(transactions)
}

// CreateInventoryTransaction creates a usage or restock transaction.
func CreateInventoryTransaction(c fiber.Ctx) error {
	var transaction models.InventoryTransaction

	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if transaction.MaterialID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Material ID is required",
		})
	}

	if transaction.Quantity <= 0 ||
		math.IsNaN(transaction.Quantity) ||
		math.IsInf(transaction.Quantity, 0) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction quantity must be a valid positive number",
		})
	}

	transaction.TransactionType = strings.ToUpper(
		strings.TrimSpace(transaction.TransactionType),
	)
	transaction.PerformedBy = strings.TrimSpace(transaction.PerformedBy)

	if transaction.TransactionType != "USE" &&
		transaction.TransactionType != "RESTOCK" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be USE or RESTOCK",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start database transaction",
		})
	}
	defer tx.Rollback(ctx)

	// Resolve the official name from the active researcher profile.
	if transaction.ResearcherID != nil {
		if *transaction.ResearcherID <= 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid researcher ID",
			})
		}

		err = tx.QueryRow(ctx, `
			SELECT full_name
			FROM researchers
			WHERE id = $1 AND status = 'ACTIVE'
		`, *transaction.ResearcherID).Scan(&transaction.PerformedBy)

		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(fiber.Map{
				"error": "Active researcher not found",
			})
		}
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to verify researcher",
			})
		}
	} else if transaction.PerformedBy == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Researcher ID or performed by name is required",
		})
	}

	// Lock the material row to prevent concurrent stock updates.
	var currentQuantity float64

	err = tx.QueryRow(ctx, `
		SELECT quantity
		FROM materials
		WHERE id = $1
		FOR UPDATE
	`, transaction.MaterialID).Scan(&currentQuantity)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Material not found",
		})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to retrieve and lock material stock",
		})
	}

	if transaction.TransactionType == "USE" &&
		transaction.Quantity > currentQuantity {
		return c.Status(400).JSON(fiber.Map{
			"error": "Insufficient material quantity",
		})
	}

	newQuantity := currentQuantity

	if transaction.TransactionType == "USE" {
		newQuantity -= transaction.Quantity
	} else {
		newQuantity += transaction.Quantity

		if math.IsInf(newQuantity, 0) {
			return c.Status(400).JSON(fiber.Map{
				"error": "Updated material quantity is too large",
			})
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE materials
		SET quantity = $1
		WHERE id = $2
	`, newQuantity, transaction.MaterialID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update material quantity",
		})
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO inventory_transactions (
			material_id, transaction_type, quantity,
			researcher_id, performed_by, notes
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`,
		transaction.MaterialID,
		transaction.TransactionType,
		transaction.Quantity,
		transaction.ResearcherID,
		transaction.PerformedBy,
		transaction.Notes,
	).Scan(&transaction.ID, &transaction.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create inventory transaction",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save inventory transaction",
		})
	}

	return c.Status(201).JSON(transaction)
}
