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

// GetEquipmentTransactions returns equipment usage sessions.
func GetEquipmentTransactions(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, equipment_id, transaction_type, performed_by,
		       notes, checkout_time, return_time, created_at
		FROM equipment_transactions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch equipment transactions",
		})
	}
	defer rows.Close()

	transactions := make([]models.EquipmentTransaction, 0)

	for rows.Next() {
		var transaction models.EquipmentTransaction

		if err := rows.Scan(
			&transaction.ID,
			&transaction.EquipmentID,
			&transaction.TransactionType,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CheckoutTime,
			&transaction.ReturnTime,
			&transaction.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read equipment transaction data",
			})
		}

		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading equipment transactions",
		})
	}

	return c.JSON(transactions)
}

// CreateEquipmentTransaction creates or completes an equipment usage session.
func CreateEquipmentTransaction(c fiber.Ctx) error {
	var request models.EquipmentTransaction

	if err := c.Bind().Body(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if request.EquipmentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Equipment ID is required",
		})
	}

	request.TransactionType = strings.ToUpper(strings.TrimSpace(request.TransactionType))
	request.PerformedBy = strings.TrimSpace(request.PerformedBy)

	if request.TransactionType != "CHECKOUT" && request.TransactionType != "RETURN" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be CHECKOUT or RETURN",
		})
	}

	if request.PerformedBy == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Performed by is required",
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

	// Lock the equipment row to prevent simultaneous checkout/return operations.
	var currentStatus string

	err = tx.QueryRow(ctx, `
		SELECT status
		FROM equipment
		WHERE id = $1
		FOR UPDATE
	`, request.EquipmentID).Scan(&currentStatus)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Equipment not found",
		})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check equipment status",
		})
	}

	currentStatus = strings.ToUpper(strings.TrimSpace(currentStatus))
	now := time.Now()

	if request.TransactionType == "CHECKOUT" {
		if currentStatus != "AVAILABLE" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Equipment is not available for checkout",
			})
		}

		var transaction models.EquipmentTransaction
		transaction.EquipmentID = request.EquipmentID
		transaction.TransactionType = "CHECKOUT"
		transaction.PerformedBy = request.PerformedBy
		transaction.Notes = request.Notes
		transaction.CheckoutTime = &now

		err = tx.QueryRow(ctx, `
			INSERT INTO equipment_transactions
				(equipment_id, transaction_type, performed_by, notes, checkout_time)
			VALUES ($1, 'CHECKOUT', $2, $3, $4)
			RETURNING id, created_at
		`,
			request.EquipmentID,
			request.PerformedBy,
			request.Notes,
			now,
		).Scan(&transaction.ID, &transaction.CreatedAt)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to create equipment checkout",
			})
		}

		_, err = tx.Exec(ctx, `
			UPDATE equipment SET status = 'IN_USE' WHERE id = $1
		`, request.EquipmentID)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to update equipment status",
			})
		}

		if err := tx.Commit(ctx); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to save equipment checkout",
			})
		}

		return c.Status(201).JSON(transaction)
	}

	// RETURN: find the active checkout session.
	if currentStatus != "IN_USE" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Equipment is not currently in use",
		})
	}

	var transaction models.EquipmentTransaction

	err = tx.QueryRow(ctx, `
		SELECT id, equipment_id, transaction_type, performed_by,
		       notes, checkout_time, created_at
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
		&transaction.PerformedBy,
		&transaction.Notes,
		&transaction.CheckoutTime,
		&transaction.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(400).JSON(fiber.Map{
			"error": "No active checkout session found for this equipment",
		})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to find active checkout session",
		})
	}

	// Only the researcher who checked out the equipment can return it.
	if !strings.EqualFold(
		strings.TrimSpace(transaction.PerformedBy),
		request.PerformedBy,
	) {
		return c.Status(403).JSON(fiber.Map{
			"error": "Only the researcher who checked out this equipment can return it",
		})
	}

	_, err = tx.Exec(ctx, `
		UPDATE equipment_transactions
		SET return_time = $1
		WHERE id = $2
	`, now, transaction.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to record equipment return",
		})
	}

	_, err = tx.Exec(ctx, `
		UPDATE equipment SET status = 'AVAILABLE' WHERE id = $1
	`, request.EquipmentID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update equipment status",
		})
	}

	transaction.ReturnTime = &now

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save equipment return",
		})
	}

	return c.JSON(transaction)
}
