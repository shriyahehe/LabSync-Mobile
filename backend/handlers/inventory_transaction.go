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
	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	rows, err := database.DB.Query(
		ctx,
		`SELECT id,
		        material_id,
		        transaction_type,
		        quantity,
		        performed_by,
		        notes,
		        created_at
		 FROM inventory_transactions
		 ORDER BY created_at DESC`,
	)

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

	// Validate material ID.
	if transaction.MaterialID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Material ID is required",
		})
	}

	// Validate quantity.
	if transaction.Quantity <= 0 ||
		math.IsNaN(transaction.Quantity) ||
		math.IsInf(transaction.Quantity, 0) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction quantity must be a valid positive number",
		})
	}

	// Normalize transaction type.
	transaction.TransactionType = strings.ToUpper(
		strings.TrimSpace(transaction.TransactionType),
	)

	if transaction.TransactionType != "USE" &&
		transaction.TransactionType != "RESTOCK" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be USE or RESTOCK",
		})
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	// Start database transaction BEFORE reading stock.
	tx, err := database.DB.Begin(ctx)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start database transaction",
		})
	}

	// Always attempt rollback unless the transaction has committed.
	defer tx.Rollback(ctx)

	// Lock the material row.
	// Concurrent transactions must wait until this transaction finishes.
	var currentQuantity float64

	err = tx.QueryRow(
		ctx,
		`SELECT quantity
		 FROM materials
		 WHERE id = $1
		 FOR UPDATE`,
		transaction.MaterialID,
	).Scan(&currentQuantity)

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

	// Prevent stock from becoming negative.
	if transaction.TransactionType == "USE" &&
		transaction.Quantity > currentQuantity {
		return c.Status(400).JSON(fiber.Map{
			"error": "Insufficient material quantity",
		})
	}

	// Calculate updated stock while holding the row lock.
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

	// Update material quantity.
	_, err = tx.Exec(
		ctx,
		`UPDATE materials
		 SET quantity = $1
		 WHERE id = $2`,
		newQuantity,
		transaction.MaterialID,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update material quantity",
		})
	}

	// Insert transaction history.
	err = tx.QueryRow(
		ctx,
		`INSERT INTO inventory_transactions
			(material_id, transaction_type, quantity, performed_by, notes)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, created_at`,
		transaction.MaterialID,
		transaction.TransactionType,
		transaction.Quantity,
		transaction.PerformedBy,
		transaction.Notes,
	).Scan(
		&transaction.ID,
		&transaction.CreatedAt,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create inventory transaction",
		})
	}

	// Commit both stock update and history together.
	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save inventory transaction",
		})
	}

	return c.Status(201).JSON(transaction)
}
