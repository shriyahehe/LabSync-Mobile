package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetEquipmentTransactions returns equipment transaction history.
func GetEquipmentTransactions(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
		`SELECT id,
		        equipment_id,
		        transaction_type,
		        performed_by,
		        notes,
		        checkout_time,
		        return_time,
		        created_at
		 FROM equipment_transactions
		 ORDER BY created_at DESC`,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch equipment transactions",
		})
	}

	defer rows.Close()

	transactions := make([]models.EquipmentTransaction, 0)

	for rows.Next() {
		var transaction models.EquipmentTransaction

		err := rows.Scan(
			&transaction.ID,
			&transaction.EquipmentID,
			&transaction.TransactionType,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CheckoutTime,
			&transaction.ReturnTime,
			&transaction.CreatedAt,
		)

		if err != nil {
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

// CreateEquipmentTransaction creates a checkout or return transaction.
func CreateEquipmentTransaction(c fiber.Ctx) error {
	var transaction models.EquipmentTransaction

	// Read JSON request body.
	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if transaction.EquipmentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Equipment ID is required",
		})
	}

	transaction.TransactionType = strings.ToUpper(
		strings.TrimSpace(transaction.TransactionType),
	)

	if transaction.TransactionType != "CHECKOUT" &&
		transaction.TransactionType != "RETURN" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be CHECKOUT or RETURN",
		})
	}

	if strings.TrimSpace(transaction.PerformedBy) == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Performed by is required",
		})
	}

	// Start database transaction.
	tx, err := database.DB.Begin(context.Background())

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start database transaction",
		})
	}

	// Always rollback if something fails before commit.
	committed := false

	defer func() {
		if !committed {
			tx.Rollback(context.Background())
		}
	}()

	// Lock the equipment row while checking/updating its status.
	var currentStatus string

	err = tx.QueryRow(
		context.Background(),
		`SELECT status
		 FROM equipment
		 WHERE id = $1
		 FOR UPDATE`,
		transaction.EquipmentID,
	).Scan(&currentStatus)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Equipment not found",
		})
	}

	currentStatus = strings.ToUpper(strings.TrimSpace(currentStatus))

	now := time.Now()

	if transaction.TransactionType == "CHECKOUT" {

		// Equipment must currently be available.
		if currentStatus != "AVAILABLE" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Equipment is not available for checkout",
			})
		}

		// Change equipment status to IN_USE.
		_, err = tx.Exec(
			context.Background(),
			`UPDATE equipment
			 SET status = 'IN_USE'
			 WHERE id = $1`,
			transaction.EquipmentID,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to update equipment status",
			})
		}

		transaction.CheckoutTime = &now
		transaction.ReturnTime = nil

	} else {

		// Equipment must currently be in use.
		if currentStatus != "IN_USE" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Equipment is not currently in use",
			})
		}

		// Change equipment status back to AVAILABLE.
		_, err = tx.Exec(
			context.Background(),
			`UPDATE equipment
			 SET status = 'AVAILABLE'
			 WHERE id = $1`,
			transaction.EquipmentID,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to update equipment status",
			})
		}

		transaction.ReturnTime = &now
	}

	// Save transaction history.
	err = tx.QueryRow(
		context.Background(),
		`INSERT INTO equipment_transactions
			(equipment_id,
			 transaction_type,
			 performed_by,
			 notes,
			 checkout_time,
			 return_time)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, created_at`,
		transaction.EquipmentID,
		transaction.TransactionType,
		transaction.PerformedBy,
		transaction.Notes,
		transaction.CheckoutTime,
		transaction.ReturnTime,
	).Scan(
		&transaction.ID,
		&transaction.CreatedAt,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create equipment transaction",
		})
	}

	// Commit all changes together.
	if err := tx.Commit(context.Background()); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save equipment transaction",
		})
	}

	committed = true

	return c.Status(201).JSON(transaction)
}
