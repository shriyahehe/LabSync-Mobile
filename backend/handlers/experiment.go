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

// resolveExperimentResearcher verifies that a linked researcher is active
// and belongs to the experiment's laboratory.
func resolveExperimentResearcher(
	ctx context.Context,
	query interface {
		QueryRow(context.Context, string, ...any) pgx.Row
	},
	researcherID *int,
	legacyName string,
	laboratoryID int,
) (string, error) {
	if researcherID == nil {
		return strings.TrimSpace(legacyName), nil
	}

	if *researcherID <= 0 {
		return "", errors.New("invalid researcher ID")
	}

	var fullName string

	err := query.QueryRow(ctx, `
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
				  AND rl.status = 'ACTIVE'
			)
		  )
	`, *researcherID, laboratoryID).Scan(&fullName)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", errors.New("active researcher not found in the selected laboratory")
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

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       researcher_id,
		       COALESCE(started_by, ''),
		       status, start_time, end_time, created_at
		FROM experiments
		WHERE ($1::boolean OR laboratory_id = ANY($2::integer[]))
		ORDER BY id DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)

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

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	var experiment models.Experiment

	err = database.DB.QueryRow(ctx, `
		SELECT id, laboratory_id, name,
		       COALESCE(description, ''),
		       researcher_id,
		       COALESCE(started_by, ''),
		       status, start_time, end_time, created_at
		FROM experiments
		WHERE id = $1
		  AND ($2::boolean OR laboratory_id = ANY($3::integer[]))
	`, id, scope.AllLaboratories, scope.LaboratoryIDs).Scan(
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
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

	if input.Status == "" {
		input.Status = "PLANNED"
	}

	if !validExperimentStatus(input.Status) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid experiment status",
		})
	}

	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, input.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}
	defer tx.Rollback(ctx)

	var verifiedLabID int

	err = tx.QueryRow(ctx, `
		SELECT id
		FROM laboratories
		WHERE id = $1
		FOR SHARE
	`, input.LaboratoryID).Scan(&verifiedLabID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Selected laboratory does not exist",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify laboratory",
		})
	}

	startedBy, err := resolveExperimentResearcher(
		ctx,
		tx,
		input.ResearcherID,
		input.StartedBy,
		input.LaboratoryID,
	)

	if err != nil {
		if strings.Contains(err.Error(), "researcher") ||
			err.Error() == "invalid researcher ID" {
			return c.Status(400).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify researcher",
		})
	}

	var experiment models.Experiment

	err = tx.QueryRow(ctx, `
		INSERT INTO experiments (
			laboratory_id, name, description,
			researcher_id, started_by, status, actor_user_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
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
		actorID,
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
			"error": "Could not create experiment. Check the supplied details.",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save experiment",
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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
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

	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, input.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}
	defer tx.Rollback(ctx)

	var currentLabID int

	err = tx.QueryRow(ctx, `
		SELECT laboratory_id
		FROM experiments
		WHERE id = $1
		FOR UPDATE
	`, id).Scan(&currentLabID)

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
		!scopeAllowsLaboratory(scope, currentLabID) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Experiment not found",
		})
	}

	var verifiedLabID int

	err = tx.QueryRow(ctx, `
		SELECT id
		FROM laboratories
		WHERE id = $1
		FOR SHARE
	`, input.LaboratoryID).Scan(&verifiedLabID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Selected laboratory does not exist",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify laboratory",
		})
	}

	startedBy := strings.TrimSpace(input.StartedBy)

	if input.ResearcherID != nil {
		startedBy, err = resolveExperimentResearcher(
			ctx,
			tx,
			input.ResearcherID,
			input.StartedBy,
			input.LaboratoryID,
		)

		if err != nil {
			if strings.Contains(err.Error(), "researcher") ||
				err.Error() == "invalid researcher ID" {
				return c.Status(400).JSON(fiber.Map{
					"error": err.Error(),
				})
			}

			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to verify researcher",
			})
		}
	}

	var experiment models.Experiment

	err = tx.QueryRow(ctx, `
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
		    status = COALESCE(NULLIF($7, ''), status),
		    actor_user_id = $8
		WHERE id = $9
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
		actorID,
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
			"error": "Could not update experiment. Check the supplied details.",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update experiment",
		})
	}

	return c.JSON(fiber.Map{
		"message":    "Experiment updated successfully",
		"experiment": experiment,
	})
}
