package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetLabEntries returns entry history for laboratories accessible to the user.
func GetLabEntries(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	var labID *int

	if value := strings.TrimSpace(c.Query("laboratory_id")); value != "" {
		id, parseErr := strconv.Atoi(value)
		if parseErr != nil || id <= 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid laboratory_id",
			})
		}

		if !scope.AllLaboratories && !scopeAllowsLaboratory(scope, id) {
			return laboratoryAccessDenied(c)
		}

		labID = &id
	}

	var researcherID *int

	if value := strings.TrimSpace(c.Query("researcher_id")); value != "" {
		id, parseErr := strconv.Atoi(value)
		if parseErr != nil || id <= 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid researcher_id",
			})
		}

		researcherID = &id
	}

	rows, err := database.DB.Query(ctx, `
		SELECT
			e.id,
			e.laboratory_id,
			l.name,
			e.researcher_id,
			e.researcher_name,
			e.check_in,
			e.check_out,
			e.actor_user_id,
			e.check_out_actor_user_id,
			COALESCE(e.notes, ''),
			e.created_at
		FROM lab_entries e
		JOIN laboratories l ON l.id = e.laboratory_id
		WHERE ($1::boolean OR e.laboratory_id = ANY($2::integer[]))
		  AND ($3::integer IS NULL OR e.laboratory_id = $3)
		  AND ($4::integer IS NULL OR e.researcher_id = $4)
		ORDER BY e.check_in DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs, labID, researcherID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch lab entry history",
		})
	}
	defer rows.Close()

	entries := make([]models.LabEntry, 0)

	for rows.Next() {
		var entry models.LabEntry

		if err := rows.Scan(
			&entry.ID,
			&entry.LaboratoryID,
			&entry.LaboratoryName,
			&entry.ResearcherID,
			&entry.ResearcherName,
			&entry.CheckIn,
			&entry.CheckOut,
			&entry.ActorUserID,
			&entry.CheckOutActorUserID,
			&entry.Notes,
			&entry.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read lab entry",
			})
		}

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading lab entries",
		})
	}

	return c.JSON(entries)
}

// GetActiveLabEntries returns researchers currently inside accessible laboratories.
func GetActiveLabEntries(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	rows, err := database.DB.Query(ctx, `
		SELECT
			e.id,
			e.laboratory_id,
			l.name,
			e.researcher_id,
			e.researcher_name,
			e.check_in,
			e.check_out,
			e.actor_user_id,
			e.check_out_actor_user_id,
			COALESCE(e.notes, ''),
			e.created_at
		FROM lab_entries e
		JOIN laboratories l ON l.id = e.laboratory_id
		WHERE e.check_out IS NULL
		  AND ($1::boolean OR e.laboratory_id = ANY($2::integer[]))
		ORDER BY e.check_in DESC
	`, scope.AllLaboratories, scope.LaboratoryIDs)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch active lab entries",
		})
	}
	defer rows.Close()

	entries := make([]models.LabEntry, 0)

	for rows.Next() {
		var entry models.LabEntry

		if err := rows.Scan(
			&entry.ID,
			&entry.LaboratoryID,
			&entry.LaboratoryName,
			&entry.ResearcherID,
			&entry.ResearcherName,
			&entry.CheckIn,
			&entry.CheckOut,
			&entry.ActorUserID,
			&entry.CheckOutActorUserID,
			&entry.Notes,
			&entry.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read active lab entry",
			})
		}

		entries = append(entries, entry)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading active entries",
		})
	}

	return c.JSON(entries)
}

// CheckInLabEntry registers a researcher or visitor entering a laboratory.
func CheckInLabEntry(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	var input models.CreateLabEntryInput

	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	input.ResearcherName = strings.TrimSpace(input.ResearcherName)
	input.Notes = strings.TrimSpace(input.Notes)

	if input.LaboratoryID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "A valid laboratory_id is required",
		})
	}

	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, input.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	if input.ResearcherID == nil && input.ResearcherName == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Researcher ID or researcher name is required",
		})
	}

	if input.ResearcherID != nil && *input.ResearcherID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid researcher_id",
		})
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to start transaction",
		})
	}
	defer tx.Rollback(ctx)

	// Verify and lock the laboratory.
	var verifiedLabID int

	err = tx.QueryRow(ctx, `
		SELECT id
		FROM laboratories
		WHERE id = $1
		FOR SHARE
	`, input.LaboratoryID).Scan(&verifiedLabID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory does not exist",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify laboratory",
		})
	}

	// Verify that the researcher is active and assigned to this laboratory.
	if input.ResearcherID != nil {
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
					  AND rl.status = 'ACTIVE'
				)
			  )
		`, *input.ResearcherID, input.LaboratoryID).Scan(&input.ResearcherName)

		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(fiber.Map{
				"error": "Active researcher not found in the selected laboratory",
			})
		}

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to verify researcher",
			})
		}
	}

	var entry models.LabEntry

	err = tx.QueryRow(ctx, `
		INSERT INTO lab_entries (
			laboratory_id,
			researcher_id,
			researcher_name,
			notes,
			actor_user_id
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id,
			laboratory_id,
			researcher_id,
			researcher_name,
			check_in,
			check_out,
			actor_user_id,
			check_out_actor_user_id,
			COALESCE(notes, ''),
			created_at
	`,
		input.LaboratoryID,
		input.ResearcherID,
		input.ResearcherName,
		input.Notes,
		actorID,
	).Scan(
		&entry.ID,
		&entry.LaboratoryID,
		&entry.ResearcherID,
		&entry.ResearcherName,
		&entry.CheckIn,
		&entry.CheckOut,
		&entry.ActorUserID,
		&entry.CheckOutActorUserID,
		&entry.Notes,
		&entry.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				return c.Status(409).JSON(fiber.Map{
					"error": "This researcher already has an active entry in this laboratory",
				})
			case "23503":
				return c.Status(400).JSON(fiber.Map{
					"error": "Laboratory or researcher does not exist",
				})
			}
		}

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check in researcher",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save check-in",
		})
	}

	return c.Status(201).JSON(entry)
}

// CheckOutLabEntry registers a researcher's departure.
// The entry is locked and its laboratory access is checked before updating it.
func CheckOutLabEntry(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	actorID, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine laboratory access",
		})
	}

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid lab entry ID",
		})
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
		FROM lab_entries
		WHERE id = $1
		  AND check_out IS NULL
		FOR UPDATE
	`, id).Scan(&laboratoryID)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Active lab entry not found",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify lab entry",
		})
	}

	// Do not disclose whether an out-of-scope entry exists.
	if !scope.AllLaboratories &&
		!scopeAllowsLaboratory(scope, laboratoryID) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Active lab entry not found",
		})
	}

	var entry models.LabEntry

	err = tx.QueryRow(ctx, `
		UPDATE lab_entries
		SET check_out = CURRENT_TIMESTAMP,
		    check_out_actor_user_id = $2
		WHERE id = $1
		  AND check_out IS NULL
		RETURNING
			id,
			laboratory_id,
			researcher_id,
			researcher_name,
			check_in,
			check_out,
			actor_user_id,
			check_out_actor_user_id,
			COALESCE(notes, ''),
			created_at
	`, id, actorID).Scan(
		&entry.ID,
		&entry.LaboratoryID,
		&entry.ResearcherID,
		&entry.ResearcherName,
		&entry.CheckIn,
		&entry.CheckOut,
		&entry.ActorUserID,
		&entry.CheckOutActorUserID,
		&entry.Notes,
		&entry.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{
			"error": "Active lab entry not found",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check out researcher",
		})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save check-out",
		})
	}

	return c.JSON(entry)
}
