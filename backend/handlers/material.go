package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

func GetMaterials(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name, category, quantity, unit,
		       minimum_quantity, expiry_date
		FROM materials
		WHERE $1::boolean OR laboratory_id = ANY($2::integer[])
		ORDER BY id
	`, scope.AllLaboratories, scope.LaboratoryIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch materials"})
	}
	defer rows.Close()

	materials := make([]models.Material, 0)
	for rows.Next() {
		var material models.Material
		if err := rows.Scan(
			&material.ID,
			&material.LaboratoryID,
			&material.Name,
			&material.Category,
			&material.Quantity,
			&material.Unit,
			&material.MinimumQuantity,
			&material.ExpiryDate,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read material data"})
		}
		materials = append(materials, material)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading materials"})
	}
	return c.JSON(materials)
}

func CreateMaterial(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	var material models.Material
	if err := c.Bind().Body(&material); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if material.LaboratoryID <= 0 || material.Name == "" || material.Unit == "" || material.Quantity < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Valid laboratory ID, name, unit and non-negative quantity are required"})
	}

	if !scopeAllowsLaboratory(scope, material.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = database.DB.QueryRow(ctx, `
		INSERT INTO materials
			(laboratory_id, name, category, quantity, unit, minimum_quantity, expiry_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`,
		material.LaboratoryID,
		material.Name,
		material.Category,
		material.Quantity,
		material.Unit,
		material.MinimumQuantity,
		material.ExpiryDate,
	).Scan(&material.ID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create material"})
	}
	return c.Status(201).JSON(material)
}
