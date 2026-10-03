package handlers

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetInventoryTransactions returns all inventory transactions.
func GetInventoryTransactions(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
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

		err := rows.Scan(
			&transaction.ID,
			&transaction.MaterialID,
			&transaction.TransactionType,
			&transaction.Quantity,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CreatedAt,
		)

		if err != nil {
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

	// Read JSON request body
	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Basic validation
	if transaction.MaterialID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Material ID is required",
		})
	}

	if transaction.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction quantity must be greater than zero",
		})
	}

	transaction.TransactionType = strings.ToUpper(
		strings.TrimSpace(transaction.TransactionType),
	)

	if transaction.TransactionType != "USE" &&
		transaction.TransactionType != "RESTOCK" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be USE or RESTOCK",
		})
	}

	// Check material exists and get current quantity.
	var currentQuantity float64

	err := database.DB.QueryRow(
		context.Background(),
		`SELECT quantity
		 FROM materials
		 WHERE id = $1`,
		transaction.MaterialID,
	).Scan(&currentQuantity)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Material not found",
		})
	}

	// Prevent using more material than available.
	if transaction.TransactionType == "USE" &&
		transaction.Quantity > currentQuantity {
		return c.Status(400).JSON(fiber.Map{
			"error": "Insufficient material quantity",
		})
	}

	// Calculate new quantity.
	newQuantity := currentQuantity

	if transaction.TransactionType == "USE" {
		newQuantity -= transaction.Quantity
	} else {
		newQuantity += transaction.Quantity
	}

	// Start transaction.
	tx, err := database.DB.Begin(context.Background())

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start database transaction",
		})
	}

	// Update material quantity.
	_, err = tx.Exec(
		context.Background(),
		`UPDATE materials
		 SET quantity = $1
		 WHERE id = $2`,
		newQuantity,
		transaction.MaterialID,
	)

	if err != nil {
		tx.Rollback(context.Background())

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update material quantity",
		})
	}

	// Insert transaction history.
	err = tx.QueryRow(
		context.Background(),
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
		tx.Rollback(context.Background())

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create inventory transaction",
		})
	}

	// Commit database transaction.
	if err := tx.Commit(context.Background()); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save inventory transaction",
		})
	}

	return c.Status(201).JSON(transaction)
}
