package handlers

import (
	"context"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetSamples returns samples belonging only to accessible laboratories.
func GetSamples(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name, sample_type, description,
		       initial_quantity, available_quantity, unit,
		       storage_location, created_at
		FROM samples
		WHERE $1::boolean OR laboratory_id = ANY($2::integer[])
		ORDER BY created_at DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)
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

// GetSample returns one sample only if it belongs to an accessible laboratory.
func GetSample(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	id, err := strconv.Atoi(strings.TrimSpace(c.Params("id")))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid sample ID"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var sample models.Sample

	err = database.DB.QueryRow(ctx, `
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

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{"error": "Sample not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch sample"})
	}

	if !scopeAllowsLaboratory(scope, sample.LaboratoryID) {
		return c.Status(404).JSON(fiber.Map{"error": "Sample not found"})
	}

	return c.JSON(sample)
}

// CreateSample adds a sample to an accessible laboratory.
func CreateSample(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

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

	if !scopeAllowsLaboratory(scope, sample.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	if math.IsNaN(sample.InitialQuantity) ||
		math.IsInf(sample.InitialQuantity, 0) ||
		sample.InitialQuantity < 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Initial quantity must be a valid non-negative number",
		})
	}

	sample.AvailableQuantity = sample.InitialQuantity

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = database.DB.QueryRow(ctx, `
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

// GetSampleTransactions returns transaction history from accessible laboratories.
func GetSampleTransactions(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT t.id, t.sample_id, t.transaction_type, t.quantity,
		       t.researcher_id, t.performed_by, t.notes, t.created_at
		FROM sample_transactions t
		JOIN samples s ON s.id = t.sample_id
		WHERE $1::boolean OR s.laboratory_id = ANY($2::integer[])
		ORDER BY t.created_at DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch sample transactions",
		})
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
			&transaction.ResearcherID,
			&transaction.PerformedBy,
			&transaction.Notes,
			&transaction.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read sample transaction data",
			})
		}

		transactions = append(transactions, transaction)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading sample transactions",
		})
	}

	return c.JSON(transactions)
}

// CreateSampleTransaction records usage or restocking within an accessible laboratory.
func CreateSampleTransaction(c fiber.Ctx) error {
	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine authenticated user access"})
	}

	var transaction models.SampleTransaction

	if err := c.Bind().Body(&transaction); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	transaction.TransactionType = strings.ToUpper(strings.TrimSpace(transaction.TransactionType))
	transaction.PerformedBy = strings.TrimSpace(transaction.PerformedBy)

	if transaction.SampleID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Sample ID is required"})
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

	// Lock the sample row and retrieve its laboratory before any stock changes.
	var laboratoryID int
	var currentQuantity float64
	var initialQuantity float64

	err = tx.QueryRow(ctx, `
		SELECT laboratory_id, available_quantity, initial_quantity
		FROM samples
		WHERE id = $1
		FOR UPDATE
	`, transaction.SampleID).Scan(
		&laboratoryID,
		&currentQuantity,
		&initialQuantity,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{"error": "Sample not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to retrieve and lock sample",
		})
	}

	if !scopeAllowsLaboratory(scope, laboratoryID) {
		return laboratoryAccessDenied(c)
	}

	// Resolve the actual researcher, and require their association with this lab.
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
			return c.Status(404).JSON(fiber.Map{
				"error": "Active researcher not found in this laboratory",
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

	newQuantity := currentQuantity

	if transaction.TransactionType == "USE" {
		if transaction.Quantity > currentQuantity {
			return c.Status(400).JSON(fiber.Map{
				"error": "Insufficient sample quantity",
			})
		}
		newQuantity -= transaction.Quantity
	} else {
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
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update sample quantity",
		})
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO sample_transactions (
			sample_id, transaction_type, quantity,
			researcher_id, performed_by, notes, actor_user_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`,
		transaction.SampleID,
		transaction.TransactionType,
		transaction.Quantity,
		transaction.ResearcherID,
		transaction.PerformedBy,
		transaction.Notes,
		actorID,
	).Scan(&transaction.ID, &transaction.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save sample transaction",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to commit sample transaction",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"transaction":        transaction,
		"available_quantity": newQuantity,
	})
}
