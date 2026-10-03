package handlers

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

// GetEquipment returns all equipment.
func GetEquipment(c fiber.Ctx) error {
	rows, err := database.DB.Query(
		context.Background(),
		`SELECT id,
		        laboratory_id,
		        name,
		        category,
		        serial_number,
		        status,
		        location,
		        description,
		        created_at
		 FROM equipment
		 ORDER BY id`,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch equipment",
		})
	}

	defer rows.Close()

	equipmentList := make([]models.Equipment, 0)

	for rows.Next() {
		var equipment models.Equipment

		err := rows.Scan(
			&equipment.ID,
			&equipment.LaboratoryID,
			&equipment.Name,
			&equipment.Category,
			&equipment.SerialNumber,
			&equipment.Status,
			&equipment.Location,
			&equipment.Description,
			&equipment.CreatedAt,
		)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read equipment data",
			})
		}

		equipmentList = append(equipmentList, equipment)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed while reading equipment",
		})
	}

	return c.JSON(equipmentList)
}

// CreateEquipment creates a new equipment item.
func CreateEquipment(c fiber.Ctx) error {
	var equipment models.Equipment

	// Read JSON request body
	if err := c.Bind().Body(&equipment); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Basic validation
	if equipment.LaboratoryID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory ID is required",
		})
	}

	if equipment.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Equipment name is required",
		})
	}

	// Normalize status
	equipment.Status = strings.ToUpper(
		strings.TrimSpace(equipment.Status),
	)

	// Default status
	if equipment.Status == "" {
		equipment.Status = "AVAILABLE"
	}

	// Validate status
	if equipment.Status != "AVAILABLE" &&
		equipment.Status != "IN_USE" &&
		equipment.Status != "MAINTENANCE" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Status must be AVAILABLE, IN_USE, or MAINTENANCE",
		})
	}

	// Insert equipment into PostgreSQL
	err := database.DB.QueryRow(
		context.Background(),
		`INSERT INTO equipment
			(laboratory_id, name, category, serial_number, status, location, description)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		equipment.LaboratoryID,
		equipment.Name,
		equipment.Category,
		equipment.SerialNumber,
		equipment.Status,
		equipment.Location,
		equipment.Description,
	).Scan(
		&equipment.ID,
		&equipment.CreatedAt,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create equipment",
		})
	}

	return c.Status(201).JSON(equipment)
}
