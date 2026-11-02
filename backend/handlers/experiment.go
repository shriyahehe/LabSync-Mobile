package handlers

import (
	"context"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

func validExperimentStatus(status string) bool {
	switch status {
	case "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED":
		return true
	default:
		return false
	}
}

// GET /api/experiments
func GetExperiments(c fiber.Ctx) error {
	rows, err := database.DB.Query(context.Background(), `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       COALESCE(started_by, ''),
		       status, start_time, end_time, created_at
		FROM experiments
		ORDER BY id DESC
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch experiments",
		})
	}
	defer rows.Close()

	experiments := []models.Experiment{}

	for rows.Next() {
		var experiment models.Experiment

		err := rows.Scan(
			&experiment.ID,
			&experiment.LaboratoryID,
			&experiment.Name,
			&experiment.Description,
			&experiment.StartedBy,
			&experiment.Status,
			&experiment.StartTime,
			&experiment.EndTime,
			&experiment.CreatedAt,
		)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read experiment data",
			})
		}

		experiments = append(experiments, experiment)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Error while reading experiments",
		})
	}

	return c.JSON(fiber.Map{
		"message":     "Experiments fetched successfully",
		"experiments": experiments,
	})
}

// GET /api/experiments/:id
func GetExperiment(c fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment ID",
		})
	}

	var experiment models.Experiment

	err = database.DB.QueryRow(context.Background(), `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       COALESCE(started_by, ''),
		       status, start_time, end_time, created_at
		FROM experiments
		WHERE id = $1
	`, id).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.StartedBy,
		&experiment.Status,
		&experiment.StartTime,
		&experiment.EndTime,
		&experiment.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(fiber.Map{
				"error": "Experiment not found",
			})
		}

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch experiment",
		})
	}

	return c.JSON(fiber.Map{
		"experiment": experiment,
	})
}

// POST /api/experiments
func CreateExperiment(c fiber.Ctx) error {
	var input struct {
		LaboratoryID int    `json:"laboratory_id"`
		Name         string `json:"name"`
		Description  string `json:"description"`
		StartedBy    string `json:"started_by"`
		Status       string `json:"status"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.Name = strings.TrimSpace(input.Name)

	if input.LaboratoryID <= 0 || input.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "laboratory_id and name are required",
		})
	}

	if input.Status == "" {
		input.Status = "PLANNED"
	}

	if !validExperimentStatus(input.Status) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment status",
		})
	}

	var experiment models.Experiment

	err := database.DB.QueryRow(context.Background(), `
		INSERT INTO experiments
			(laboratory_id, name, description, started_by, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, laboratory_id, name,
		          COALESCE(description, ''),
		          COALESCE(started_by, ''),
		          status, start_time, end_time, created_at
	`,
		input.LaboratoryID,
		input.Name,
		input.Description,
		input.StartedBy,
		input.Status,
	).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.StartedBy,
		&experiment.Status,
		&experiment.StartTime,
		&experiment.EndTime,
		&experiment.CreatedAt,
	)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Could not create experiment. Check that the laboratory exists.",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message":    "Experiment created successfully",
		"experiment": experiment,
	})
}

// PUT /api/experiments/:id
func UpdateExperiment(c fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment ID",
		})
	}

	var input struct {
		LaboratoryID int    `json:"laboratory_id"`
		Name         string `json:"name"`
		Description  string `json:"description"`
		StartedBy    string `json:"started_by"`
		Status       string `json:"status"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.Name = strings.TrimSpace(input.Name)

	if input.LaboratoryID <= 0 || input.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "laboratory_id and name are required",
		})
	}

	if input.Status != "" && !validExperimentStatus(input.Status) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment status",
		})
	}

	var experiment models.Experiment

	err = database.DB.QueryRow(context.Background(), `
		UPDATE experiments
		SET laboratory_id = $1,
		    name = $2,
		    description = $3,
		    started_by = $4,
		    status = COALESCE(NULLIF($5, ''), status)
		WHERE id = $6
		RETURNING id, laboratory_id, name,
		          COALESCE(description, ''),
		          COALESCE(started_by, ''),
		          status, start_time, end_time, created_at
	`,
		input.LaboratoryID,
		input.Name,
		input.Description,
		input.StartedBy,
		input.Status,
		id,
	).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.StartedBy,
		&experiment.Status,
		&experiment.StartTime,
		&experiment.EndTime,
		&experiment.CreatedAt,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(fiber.Map{
				"error": "Experiment not found",
			})
		}

		return c.Status(400).JSON(fiber.Map{
			"error": "Could not update experiment. Check the laboratory ID.",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Experiment updated successfully",
		"experiment": experiment,
	})
}
