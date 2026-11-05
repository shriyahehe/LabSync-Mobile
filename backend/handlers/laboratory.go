package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetLaboratories returns all laboratories.
func GetLaboratories(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
		`SELECT id, name, department, location
		 FROM laboratories
		 ORDER BY id`,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch laboratories",
		})
	}

	defer rows.Close()

	var laboratories []models.Laboratory

	for rows.Next() {
		var lab models.Laboratory

		err := rows.Scan(
			&lab.ID,
			&lab.Name,
			&lab.Department,
			&lab.Location,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read laboratory data",
			})
		}

		laboratories = append(laboratories, lab)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading laboratories",
		})
	}

	return c.JSON(laboratories)
}

// CreateLaboratory creates a new laboratory.
func CreateLaboratory(c fiber.Ctx) error {
	var lab models.Laboratory

	// Read JSON request body
	if err := c.Bind().Body(&lab); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Basic validation
	if lab.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory name is required",
		})
	}

	// Insert laboratory into PostgreSQL
	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO laboratories (name, department, location)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		lab.Name,
		lab.Department,
		lab.Location,
	).Scan(&lab.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create laboratory",
		})
	}

	return c.Status(201).JSON(lab)
}
