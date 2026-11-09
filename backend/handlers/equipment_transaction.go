package handlers

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

func GetEquipmentTransactions(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT t.id, t.equipment_id, t.transaction_type, t.researcher_id,
		       t.performed_by, t.notes, t.checkout_time, t.return_time, t.created_at
		FROM equipment_transactions t
		JOIN equipment e ON e.id = t.equipment_id
		WHERE $1::boolean OR e.laboratory_id = ANY($2::integer[])
		ORDER BY t.created_at DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch equipment transactions"})
	}
	defer rows.Close()

	transactions := make([]models.EquipmentTransaction, 0)
	for rows.Next() {
		var transaction models.EquipmentTransaction
		if err := rows.Scan(
			&transaction.ID,
			&transaction.EquipmentID,
			&transaction.TransactionType,
			&transaction.ResearcherID,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CheckoutTime,
			&transaction.ReturnTime,
			&transaction.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read equipment transaction data"})
		}
		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading equipment transactions"})
	}
	return c.JSON(transactions)
}

func CreateEquipmentTransaction(c fiber.Ctx) error {
	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine authenticated user access"})
	}

	var request models.EquipmentTransaction
	if err := c.Bind().Body(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if request.EquipmentID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Equipment ID is required"})
	}

	request.TransactionType = strings.ToUpper(strings.TrimSpace(request.TransactionType))
	request.PerformedBy = strings.TrimSpace(request.PerformedBy)

	if request.TransactionType != "CHECKOUT" && request.TransactionType != "RETURN" {
		return c.Status(400).JSON(fiber.Map{"error": "Transaction type must be CHECKOUT or RETURN"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start database transaction"})
	}
	defer tx.Rollback(ctx)

	var laboratoryID int
	var currentStatus string

	err = tx.QueryRow(ctx, `
		SELECT laboratory_id, status
		FROM equipment
		WHERE id = $1
		FOR UPDATE
	`, request.EquipmentID).Scan(&laboratoryID, &currentStatus)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{"error": "Equipment not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to retrieve equipment"})
	}
	if !scopeAllowsLaboratory(scope, laboratoryID) {
		return laboratoryAccessDenied(c)
	}

	if request.ResearcherID != nil {
		if *request.ResearcherID <= 0 {
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
		`, *request.ResearcherID, laboratoryID).Scan(&request.PerformedBy)

		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(403).JSON(fiber.Map{
				"error": "Researcher is not active or is not assigned to this laboratory",
			})
		}
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to verify researcher"})
		}
	} else if request.PerformedBy == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Researcher ID or performed by name is required"})
	}

	currentStatus = strings.ToUpper(strings.TrimSpace(currentStatus))
	now := time.Now()

	if request.TransactionType == "CHECKOUT" {
		if currentStatus != "AVAILABLE" {
			return c.Status(400).JSON(fiber.Map{"error": "Equipment is not available for checkout"})
		}

		var transaction models.EquipmentTransaction
		err = tx.QueryRow(ctx, `
			INSERT INTO equipment_transactions (
				equipment_id, transaction_type, researcher_id,
				performed_by, notes, checkout_time, actor_user_id
			)
			VALUES ($1, 'CHECKOUT', $2, $3, $4, $5, $6)
			RETURNING id, created_at
		`,
			request.EquipmentID,
			request.ResearcherID,
			request.PerformedBy,
			request.Notes,
			now,
			actorID,
		).Scan(&transaction.ID, &transaction.CreatedAt)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create equipment checkout"})
		}

		_, err = tx.Exec(ctx, `
			UPDATE equipment SET status = 'IN_USE' WHERE id = $1
		`, request.EquipmentID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update equipment status"})
		}

		transaction.EquipmentID = request.EquipmentID
		transaction.TransactionType = "CHECKOUT"
		transaction.ResearcherID = request.ResearcherID
		transaction.PerformedBy = request.PerformedBy
		transaction.Notes = request.Notes
		transaction.CheckoutTime = &now

		if err := tx.Commit(ctx); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save equipment checkout"})
		}
		return c.Status(201).JSON(transaction)
	}

	if currentStatus != "IN_USE" {
		return c.Status(400).JSON(fiber.Map{"error": "Equipment is not currently in use"})
	}

	var transaction models.EquipmentTransaction
	err = tx.QueryRow(ctx, `
		SELECT id, equipment_id, transaction_type, researcher_id,
		       performed_by, notes, checkout_time, created_at
		FROM equipment_transactions
		WHERE equipment_id = $1
		  AND transaction_type = 'CHECKOUT'
		  AND return_time IS NULL
		ORDER BY checkout_time DESC
		LIMIT 1
		FOR UPDATE
	`, request.EquipmentID).Scan(
		&transaction.ID,
		&transaction.EquipmentID,
		&transaction.TransactionType,
		&transaction.ResearcherID,
		&transaction.PerformedBy,
		&transaction.Notes,
		&transaction.CheckoutTime,
		&transaction.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(400).JSON(fiber.Map{"error": "No active checkout session found for this equipment"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to find active checkout session"})
	}

	if transaction.ResearcherID != nil {
		if request.ResearcherID == nil || *request.ResearcherID != *transaction.ResearcherID {
			return c.Status(403).JSON(fiber.Map{"error": "Only the researcher who checked out this equipment can return it"})
		}
	} else if !strings.EqualFold(strings.TrimSpace(transaction.PerformedBy), request.PerformedBy) {
		return c.Status(403).JSON(fiber.Map{"error": "Only the researcher who checked out this equipment can return it"})
	}

	_, err = tx.Exec(ctx, `
		UPDATE equipment_transactions
		SET return_time = $1
		WHERE id = $2
	`, now, transaction.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to record equipment return"})
	}

	_, err = tx.Exec(ctx, `
		UPDATE equipment SET status = 'AVAILABLE' WHERE id = $1
	`, request.EquipmentID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update equipment status"})
	}

	// Preserve the original checkout actor; record the return actor separately.
	_, err = tx.Exec(ctx, `
		INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
		VALUES ($1, 'EQUIPMENT_RETURN', 'equipment_transaction', $2)
	`, actorID, transaction.ID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to record return audit event"})
	}

	transaction.ReturnTime = &now

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save equipment return"})
	}
	return c.JSON(transaction)
}
