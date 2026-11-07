package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetMaterials returns all materials.
func GetMaterials(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
		`SELECT id,
		        laboratory_id,
		        name,
		        category,
		        quantity,
		        unit,
		        minimum_quantity,
		        expiry_date
		 FROM materials
		 ORDER BY id`,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch materials",
		})
	}

	defer rows.Close()

	var materials []models.Material

	for rows.Next() {
		var material models.Material

		err := rows.Scan(
			&material.ID,
			&material.LaboratoryID,
			&material.Name,
			&material.Category,
			&material.Quantity,
			&material.Unit,
			&material.MinimumQuantity,
			&material.ExpiryDate,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read material data",
			})
		}

		materials = append(materials, material)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading materials",
		})
	}

	return c.JSON(materials)
}

// CreateMaterial creates a new material.
func CreateMaterial(c fiber.Ctx) error {
	var material models.Material

	// Read JSON request body
	if err := c.Bind().Body(&material); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Basic validation
	if material.LaboratoryID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory ID is required",
		})
	}

	if material.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Material name is required",
		})
	}

	if material.Unit == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Material unit is required",
		})
	}

	if material.Quantity < 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Quantity cannot be negative",
		})
	}

	// Insert material into PostgreSQL
	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO materials
			(laboratory_id, name, category, quantity, unit, minimum_quantity, expiry_date)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id`,
		material.LaboratoryID,
		material.Name,
		material.Category,
		material.Quantity,
		material.Unit,
		material.MinimumQuantity,
		material.ExpiryDate,
	).Scan(&material.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create material",
		})
	}

	return c.Status(201).JSON(material)
}
