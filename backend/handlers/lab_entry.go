package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5/pgconn"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetLabEntries returns entry history.
func GetLabEntries(c fiber.Ctx) error {
	query := `
        SELECT e.id, e.laboratory_id, l.name,
               e.researcher_name, e.check_in, e.check_out,
               COALESCE(e.notes, ''), e.created_at
        FROM lab_entries e
        JOIN laboratories l ON l.id = e.laboratory_id
    `

	args := []any{}

	if labID := c.Query("laboratory_id"); labID != "" {
		id, err := strconv.Atoi(labID)
		if err != nil || id <= 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid laboratory_id",
			})
		}

		query += " WHERE e.laboratory_id = $1"
		args = append(args, id)
	}

	query += " ORDER BY e.check_in DESC"

	rows, err := database.DB.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch lab entry history",
		})
	}
	defer rows.Close()

	entries := []models.LabEntry{}

	for rows.Next() {
		var entry models.LabEntry

		if err := rows.Scan(
			&entry.ID,
			&entry.LaboratoryID,
			&entry.LaboratoryName,
			&entry.ResearcherName,
			&entry.CheckIn,
			&entry.CheckOut,
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

// GetActiveLabEntries returns researchers currently inside laboratories.
func GetActiveLabEntries(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
		`SELECT e.id, e.laboratory_id, l.name,
                e.researcher_name, e.check_in, e.check_out,
                COALESCE(e.notes, ''), e.created_at
         FROM lab_entries e
         JOIN laboratories l ON l.id = e.laboratory_id
         WHERE e.check_out IS NULL
         ORDER BY e.check_in DESC`,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch active lab entries",
		})
	}
	defer rows.Close()

	entries := []models.LabEntry{}

	for rows.Next() {
		var entry models.LabEntry

		if err := rows.Scan(
			&entry.ID,
			&entry.LaboratoryID,
			&entry.LaboratoryName,
			&entry.ResearcherName,
			&entry.CheckIn,
			&entry.CheckOut,
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

// CheckInLabEntry registers a researcher entering a laboratory.
func CheckInLabEntry(c fiber.Ctx) error {
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

	if input.ResearcherName == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Researcher name is required",
		})
	}

	var entry models.LabEntry

	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO lab_entries
            (laboratory_id, researcher_name, notes)
         VALUES ($1, $2, $3)
         RETURNING id, laboratory_id, researcher_name,
                   check_in, check_out, COALESCE(notes, ''), created_at`,
		input.LaboratoryID,
		input.ResearcherName,
		input.Notes,
	).Scan(
		&entry.ID,
		&entry.LaboratoryID,
		&entry.ResearcherName,
		&entry.CheckIn,
		&entry.CheckOut,
		&entry.Notes,
		&entry.CreatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return c.Status(409).JSON(fiber.Map{
					"error": "This researcher already has an active entry in this laboratory",
				})
			}
			if pgErr.Code == "23503" {
				return c.Status(400).JSON(fiber.Map{
					"error": "Laboratory does not exist",
				})
			}
		}

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to check in researcher",
		})
	}

	entry.LaboratoryName = ""

	return c.Status(201).JSON(entry)
}

// CheckOutLabEntry registers a researcher's departure.
func CheckOutLabEntry(c fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid lab entry ID",
		})
	}

	var entry models.LabEntry

	err = database.DB.QueryRow(
		context.Background(),
		`UPDATE lab_entries
         SET check_out = CURRENT_TIMESTAMP
         WHERE id = $1 AND check_out IS NULL
         RETURNING id, laboratory_id, researcher_name,
                   check_in, check_out, COALESCE(notes, ''), created_at`,
		id,
	).Scan(
		&entry.ID,
		&entry.LaboratoryID,
		&entry.ResearcherName,
		&entry.CheckIn,
		&entry.CheckOut,
		&entry.Notes,
		&entry.CreatedAt,
	)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "Active lab entry not found",
		})
	}

	return c.JSON(entry)
}
