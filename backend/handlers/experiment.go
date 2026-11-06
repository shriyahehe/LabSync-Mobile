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

func validExperimentStatus(status string) bool {
	switch status {
	case "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED":
		return true
	default:
		return false
	}
}

// resolveExperimentResearcher gets the official name of an active researcher.
func resolveExperimentResearcher(
	ctx context.Context,
	query interface {
		QueryRow(context.Context, string, ...any) pgx.Row
	},
	researcherID *int,
	legacyName string,
) (string, error) {
	if researcherID == nil {
		return strings.TrimSpace(legacyName), nil
	}

	if *researcherID <= 0 {
		return "", errors.New("invalid researcher ID")
	}

	var fullName string
	err := query.QueryRow(ctx, `
		SELECT full_name
		FROM researchers
		WHERE id = $1 AND status = 'ACTIVE'
	`, *researcherID).Scan(&fullName)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", errors.New("active researcher not found")
	}
	if err != nil {
		return "", err
	}

	return fullName, nil
}

// GET /api/experiments
func GetExperiments(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       researcher_id,
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

	experiments := make([]models.Experiment, 0)

	for rows.Next() {
		var experiment models.Experiment

		if err := rows.Scan(
			&experiment.ID,
			&experiment.LaboratoryID,
			&experiment.Name,
			&experiment.Description,
			&experiment.ResearcherID,
			&experiment.StartedBy,
			&experiment.Status,
			&experiment.StartTime,
			&experiment.EndTime,
			&experiment.CreatedAt,
		); err != nil {
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var experiment models.Experiment

	err = database.DB.QueryRow(ctx, `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       researcher_id,
		       COALESCE(started_by, ''),
		       status, start_time, end_time, created_at
		FROM experiments
		WHERE id = $1
	`, id).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.ResearcherID,
		&experiment.StartedBy,
		&experiment.Status,
		&experiment.StartTime,
		&experiment.EndTime,
		&experiment.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}
	if err != nil {
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
		ResearcherID *int   `json:"researcher_id"`
		StartedBy    string `json:"started_by"`
		Status       string `json:"status"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Status = strings.ToUpper(strings.TrimSpace(input.Status))

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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	startedBy, err := resolveExperimentResearcher(
		ctx,
		database.DB,
		input.ResearcherID,
		input.StartedBy,
	)
	if err != nil {
		if err.Error() == "invalid researcher ID" ||
			err.Error() == "active researcher not found" {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify researcher",
		})
	}

	var experiment models.Experiment

	err = database.DB.QueryRow(ctx, `
		INSERT INTO experiments (
			laboratory_id, name, description,
			researcher_id, started_by, status
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, laboratory_id, name,
		          COALESCE(description, ''),
		          researcher_id,
		          COALESCE(started_by, ''),
		          status, start_time, end_time, created_at
	`,
		input.LaboratoryID,
		input.Name,
		input.Description,
		input.ResearcherID,
		startedBy,
		input.Status,
	).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.ResearcherID,
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
		ResearcherID *int   `json:"researcher_id"`
		StartedBy    string `json:"started_by"`
		Status       string `json:"status"`
	}

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Status = strings.ToUpper(strings.TrimSpace(input.Status))

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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	startedBy, err := resolveExperimentResearcher(
		ctx,
		database.DB,
		input.ResearcherID,
		input.StartedBy,
	)
	if err != nil {
		if err.Error() == "invalid researcher ID" ||
			err.Error() == "active researcher not found" {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify researcher",
		})
	}

	var experiment models.Experiment

	err = database.DB.QueryRow(ctx, `
		UPDATE experiments
		SET laboratory_id = $1,
		    name = $2,
		    description = $3,
		    researcher_id = CASE
		        WHEN $4::integer IS NOT NULL THEN $4
		        ELSE researcher_id
		    END,
		    started_by = CASE
		        WHEN $4::integer IS NOT NULL THEN $5
		        ELSE $6
		    END,
		    status = COALESCE(NULLIF($7, ''), status)
		WHERE id = $8
		RETURNING id, laboratory_id, name,
		          COALESCE(description, ''),
		          researcher_id,
		          COALESCE(started_by, ''),
		          status, start_time, end_time, created_at
	`,
		input.LaboratoryID,
		input.Name,
		input.Description,
		input.ResearcherID,
		startedBy,
		input.StartedBy,
		input.Status,
		id,
	).Scan(
		&experiment.ID,
		&experiment.LaboratoryID,
		&experiment.Name,
		&experiment.Description,
		&experiment.ResearcherID,
		&experiment.StartedBy,
		&experiment.Status,
		&experiment.StartTime,
		&experiment.EndTime,
		&experiment.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Could not update experiment. Check the laboratory ID.",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Experiment updated successfully",
		"experiment": experiment,
	})
}
