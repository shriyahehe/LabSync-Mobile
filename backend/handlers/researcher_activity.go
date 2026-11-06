package handlers

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
)

type ResearcherActivity struct {
	ActivityType string    `json:"activity_type"`
	ReferenceID  int       `json:"reference_id"`
	Title        string    `json:"title"`
	Details      string    `json:"details"`
	OccurredAt   time.Time `json:"occurred_at"`
}

// GET /api/researchers/:id/activity
func GetResearcherActivity(c fiber.Ctx) error {
	researcherID, err := strconv.Atoi(c.Params("id"))
	if err != nil || researcherID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid researcher ID",
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var researcherExists bool

	err = database.DB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM researchers WHERE id = $1
		)
	`, researcherID).Scan(&researcherExists)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to verify researcher",
		})
	}

	if !researcherExists {
		return c.Status(404).JSON(fiber.Map{
			"error": "Researcher not found",
		})
	}

	rows, err := database.DB.Query(ctx, `
		SELECT *
		FROM (
			SELECT
				'LAB_ENTRY'::text AS activity_type,
				le.id AS reference_id,
				COALESCE(l.name, 'Laboratory') AS title,
				'Check-in: ' ||
					TO_CHAR(le.check_in, 'DD Mon YYYY HH24:MI') ||
					CASE
						WHEN le.check_out IS NOT NULL
						THEN ' | Check-out: ' ||
							TO_CHAR(le.check_out, 'DD Mon YYYY HH24:MI')
						ELSE ' | Currently checked in'
					END ||
					CASE
						WHEN COALESCE(le.notes, '') <> ''
						THEN ' | ' || le.notes
						ELSE ''
					END AS details,
				le.check_in AS occurred_at
			FROM lab_entries le
			LEFT JOIN laboratories l ON l.id = le.laboratory_id
			WHERE le.researcher_id = $1

			UNION ALL

			SELECT
				'EQUIPMENT'::text,
				et.id,
				COALESCE(e.name, 'Equipment'),
				et.transaction_type || ' | ' ||
					COALESCE(et.notes, ''),
				COALESCE(et.checkout_time, et.created_at)
			FROM equipment_transactions et
			LEFT JOIN equipment e ON e.id = et.equipment_id
			WHERE et.researcher_id = $1

			UNION ALL

			SELECT
				'SAMPLE'::text,
				st.id,
				COALESCE(s.name, 'Sample'),
				st.transaction_type || ' | Quantity: ' ||
					st.quantity::text || ' ' ||
					COALESCE(s.unit, '') ||
					CASE
						WHEN COALESCE(st.notes, '') <> ''
						THEN ' | ' || st.notes
						ELSE ''
					END,
				st.created_at
			FROM sample_transactions st
			LEFT JOIN samples s ON s.id = st.sample_id
			WHERE st.researcher_id = $1

			UNION ALL

			SELECT
				'MATERIAL'::text,
				it.id,
				COALESCE(m.name, 'Material'),
				it.transaction_type || ' | Quantity: ' ||
					it.quantity::text ||
					CASE
						WHEN COALESCE(it.notes, '') <> ''
						THEN ' | ' || it.notes
						ELSE ''
					END,
				it.created_at
			FROM inventory_transactions it
			LEFT JOIN materials m ON m.id = it.material_id
			WHERE it.researcher_id = $1

			UNION ALL

			SELECT
				'EXPERIMENT'::text,
				ex.id,
				ex.name,
				COALESCE(ex.status, '') ||
					CASE
						WHEN COALESCE(ex.description, '') <> ''
						THEN ' | ' || ex.description
						ELSE ''
					END,
				COALESCE(ex.start_time, ex.created_at)
			FROM experiments ex
			WHERE ex.researcher_id = $1
		) AS activity
		ORDER BY occurred_at DESC
	`, researcherID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch researcher activity",
		})
	}
	defer rows.Close()

	activities := make([]ResearcherActivity, 0)

	for rows.Next() {
		var activity ResearcherActivity

		if err := rows.Scan(
			&activity.ActivityType,
			&activity.ReferenceID,
			&activity.Title,
			&activity.Details,
			&activity.OccurredAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read researcher activity",
			})
		}

		activities = append(activities, activity)
	}

	if err := rows.Err(); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.JSON(activities)
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Error while reading researcher activity",
		})
	}

	return c.JSON(fiber.Map{
		"researcher_id": researcherID,
		"activities":    activities,
		"total":         len(activities),
	})
}
