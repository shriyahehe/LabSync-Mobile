package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

// POST /api/experiments/:id/records
func CreateExperimentRecord(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	experimentID, err := strconv.Atoi(c.Params("id"))
	if err != nil || experimentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment ID",
		})
	}

	var input struct {
		RecordedBy string `json:"recorded_by"`
		RecordType string `json:"record_type"`
		Notes      string `json:"notes"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.RecordedBy = strings.TrimSpace(input.RecordedBy)
	input.RecordType = strings.ToUpper(strings.TrimSpace(input.RecordType))
	input.Notes = strings.TrimSpace(input.Notes)

	if input.Notes == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Observation notes are required",
		})
	}

	if input.RecordType == "" {
		input.RecordType = "OBSERVATION"
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}
	defer tx.Rollback(ctx)

	var laboratoryID int

	err = tx.QueryRow(ctx, `
		SELECT laboratory_id
		FROM experiments
		WHERE id = $1
		FOR SHARE
	`, experimentID).Scan(&laboratoryID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify experiment",
		})
	}

	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, laboratoryID) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	var record models.ExperimentRecord

	err = tx.QueryRow(ctx, `
		INSERT INTO experiment_records (
			experiment_id, recorded_by, record_type, notes, actor_user_id
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, experiment_id,
		          COALESCE(recorded_by, ''),
		          record_type, notes, created_at
	`,
		experimentID,
		input.RecordedBy,
		input.RecordType,
		input.Notes,
		actorID,
	).Scan(
		&record.ID,
		&record.ExperimentID,
		&record.RecordedBy,
		&record.RecordType,
		&record.Notes,
		&record.CreatedAt,
	)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Could not add observation. Check the experiment and record details.",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save experiment record",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Experiment record added successfully",
		"record":  record,
	})
}

// GET /api/experiments/:id/records
func GetExperimentRecords(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	experimentID, err := strconv.Atoi(c.Params("id"))
	if err != nil || experimentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment ID",
		})
	}

	var laboratoryID int

	err = database.DB.QueryRow(ctx, `
		SELECT laboratory_id
		FROM experiments
		WHERE id = $1
	`, experimentID).Scan(&laboratoryID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify experiment",
		})
	}

	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, laboratoryID) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	rows, err := database.DB.Query(ctx, `
		SELECT id, experiment_id,
		       COALESCE(recorded_by, ''),
		       record_type, notes, created_at
		FROM experiment_records
		WHERE experiment_id = $1
		ORDER BY created_at ASC, id ASC
	`, experimentID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch experiment records",
		})
	}
	defer rows.Close()

	records := make([]models.ExperimentRecord, 0)

	for rows.Next() {
		var record models.ExperimentRecord

		if err := rows.Scan(
			&record.ID,
			&record.ExperimentID,
			&record.RecordedBy,
			&record.RecordType,
			&record.Notes,
			&record.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read experiment records",
			})
		}

		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Error while reading experiment records",
		})
	}

	return c.JSON(fiber.Map{
		"experiment_id": experimentID,
		"records":       records,
	})
}
