package handlers

import (
	"context"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// POST /api/experiments/:id/records
func CreateExperimentRecord(c fiber.Ctx) error {
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

	input.Notes = strings.TrimSpace(input.Notes)

	if input.Notes == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Observation notes are required",
		})
	}

	if input.RecordType == "" {
		input.RecordType = "OBSERVATION"
	}

	var record models.ExperimentRecord

	err = database.DB.QueryRow(context.Background(), `
		INSERT INTO experiment_records
			(experiment_id, recorded_by, record_type, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, experiment_id,
		          COALESCE(recorded_by, ''),
		          record_type, notes, created_at
	`,
		experimentID,
		input.RecordedBy,
		input.RecordType,
		input.Notes,
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
			"error": "Could not add observation. Check that the experiment exists.",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Experiment record added successfully",
		"record":  record,
	})
}

// GET /api/experiments/:id/records
func GetExperimentRecords(c fiber.Ctx) error {
	experimentID, err := strconv.Atoi(c.Params("id"))
	if err != nil || experimentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment ID",
		})
	}

	var exists bool

	err = database.DB.QueryRow(context.Background(), `
		SELECT EXISTS (
			SELECT 1 FROM experiments WHERE id = $1
		)
	`, experimentID).Scan(&exists)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify experiment",
		})
	}

	if !exists {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	rows, err := database.DB.Query(context.Background(), `
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

	records := []models.ExperimentRecord{}

	for rows.Next() {
		var record models.ExperimentRecord

		err := rows.Scan(
			&record.ID,
			&record.ExperimentID,
			&record.RecordedBy,
			&record.RecordType,
			&record.Notes,
			&record.CreatedAt,
		)

		if err != nil {
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
