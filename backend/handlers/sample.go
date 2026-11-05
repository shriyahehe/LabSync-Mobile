package handlers

import (
	"context"
	"math"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetSamples returns all samples.
func GetSamples(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name, sample_type, description,
		       initial_quantity, available_quantity, unit,
		       storage_location, created_at
		FROM samples
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch samples"})
	}
	defer rows.Close()

	samples := make([]models.Sample, 0)

	for rows.Next() {
		var sample models.Sample

		if err := rows.Scan(
			&sample.ID,
			&sample.LaboratoryID,
			&sample.Name,
			&sample.SampleType,
			&sample.Description,
			&sample.InitialQuantity,
			&sample.AvailableQuantity,
			&sample.Unit,
			&sample.StorageLocation,
			&sample.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read sample data"})
		}

		samples = append(samples, sample)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading samples"})
	}

	return c.JSON(samples)
}

// GetSample returns one sample by ID.
func GetSample(c fiber.Ctx) error {
	id := strings.TrimSpace(c.Params("id"))
	if id == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Sample ID is required"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var sample models.Sample

	err := database.DB.QueryRow(ctx, `
		SELECT id, laboratory_id, name, sample_type, description,
		       initial_quantity, available_quantity, unit,
		       storage_location, created_at
		FROM samples
		WHERE id = $1
	`, id).Scan(
		&sample.ID,
		&sample.LaboratoryID,
		&sample.Name,
		&sample.SampleType,
		&sample.Description,
		&sample.InitialQuantity,
		&sample.AvailableQuantity,
		&sample.Unit,
		&sample.StorageLocation,
		&sample.CreatedAt,
	)

	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Sample not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch sample"})
	}

	return c.JSON(sample)
}

// CreateSample adds a new sample.
func CreateSample(c fiber.Ctx) error {
	var sample models.Sample

	if err := c.Bind().Body(&sample); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	sample.Name = strings.TrimSpace(sample.Name)
	sample.Unit = strings.TrimSpace(sample.Unit)

	if sample.LaboratoryID <= 0 || sample.Name == "" || sample.Unit == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory ID, sample name and unit are required",
		})
	}

	if math.IsNaN(sample.InitialQuantity) ||
		math.IsInf(sample.InitialQuantity, 0) ||
		sample.InitialQuantity < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Initial quantity must be a valid non-negative number"})
	}

	sample.AvailableQuantity = sample.InitialQuantity

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := database.DB.QueryRow(ctx, `
		INSERT INTO samples (
			laboratory_id, name, sample_type, description,
			initial_quantity, available_quantity, unit, storage_location
		)
		VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
		RETURNING id, created_at
	`,
		sample.LaboratoryID,
		sample.Name,
		sample.SampleType,
		sample.Description,
		sample.InitialQuantity,
		sample.Unit,
		sample.StorageLocation,
	).Scan(&sample.ID, &sample.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create sample"})
	}

	return c.Status(201).JSON(sample)
}

// GetSampleTransactions returns usage/restock history.
func GetSampleTransactions(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, sample_id, transaction_type, quantity,
		       performed_by, notes, created_at
		FROM sample_transactions
		ORDER BY created_at DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch sample transactions"})
	}
	defer rows.Close()

	transactions := make([]models.SampleTransaction, 0)

	for rows.Next() {
		var transaction models.SampleTransaction

		if err := rows.Scan(
			&transaction.ID,
			&transaction.SampleID,
			&transaction.TransactionType,
			&transaction.Quantity,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read sample transaction data"})
		}

		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading sample transactions"})
	}

	return c.JSON(transactions)
}

// CreateSampleTransaction records sample usage or restocking.
func CreateSampleTransaction(c fiber.Ctx) error {
	var transaction models.SampleTransaction

	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	transaction.TransactionType = strings.ToUpper(strings.TrimSpace(transaction.TransactionType))
	transaction.PerformedBy = strings.TrimSpace(transaction.PerformedBy)

	if transaction.SampleID <= 0 || transaction.PerformedBy == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Sample ID and performed by are required",
		})
	}

	if transaction.TransactionType != "USE" && transaction.TransactionType != "RESTOCK" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Transaction type must be USE or RESTOCK",
		})
	}

	if math.IsNaN(transaction.Quantity) ||
		math.IsInf(transaction.Quantity, 0) ||
		transaction.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Quantity must be a valid number greater than zero",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback(ctx)

	var currentQuantity float64

	err = tx.QueryRow(ctx, `
		SELECT available_quantity
		FROM samples
		WHERE id = $1
		FOR UPDATE
	`, transaction.SampleID).Scan(&currentQuantity)

	if err == pgx.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Sample not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to read sample quantity"})
	}

	newQuantity := currentQuantity

	if transaction.TransactionType == "USE" {
		if transaction.Quantity > currentQuantity {
			return c.Status(400).JSON(fiber.Map{"error": "Insufficient sample quantity"})
		}
		newQuantity -= transaction.Quantity
	} else {
		var initialQuantity float64

		err = tx.QueryRow(ctx, `
			SELECT initial_quantity
			FROM samples
			WHERE id = $1
		`, transaction.SampleID).Scan(&initialQuantity)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read initial sample quantity"})
		}

		newQuantity += transaction.Quantity
		if math.IsInf(newQuantity, 0) || newQuantity > initialQuantity {
			return c.Status(400).JSON(fiber.Map{
				"error": "Restocking cannot exceed the initial sample quantity",
			})
		}
	}

	_, err = tx.Exec(ctx, `
		UPDATE samples
		SET available_quantity = $1
		WHERE id = $2
	`, newQuantity, transaction.SampleID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update sample quantity"})
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO sample_transactions (
			sample_id, transaction_type, quantity, performed_by, notes
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`,
		transaction.SampleID,
		transaction.TransactionType,
		transaction.Quantity,
		transaction.PerformedBy,
		transaction.Notes,
	).Scan(&transaction.ID, &transaction.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save sample transaction"})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to commit sample transaction"})
	}

	return c.Status(201).JSON(fiber.Map{
		"transaction":        transaction,
		"available_quantity": newQuantity,
	})
}
