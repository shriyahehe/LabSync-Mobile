package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"
)

func GetEquipment(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rows, err := database.DB.Query(ctx, `
		SELECT id, laboratory_id, name, category, serial_number,
		       status, location, description, created_at
		FROM equipment
		WHERE $1::boolean OR laboratory_id = ANY($2::integer[])
		ORDER BY id
	`, scope.AllLaboratories, scope.LaboratoryIDs)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch equipment"})
	}
	defer rows.Close()

	equipmentList := make([]models.Equipment, 0)
	for rows.Next() {
		var equipment models.Equipment
		if err := rows.Scan(
			&equipment.ID,
			&equipment.LaboratoryID,
			&equipment.Name,
			&equipment.Category,
			&equipment.SerialNumber,
			&equipment.Status,
			&equipment.Location,
			&equipment.Description,
			&equipment.CreatedAt,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read equipment data"})
		}
		equipmentList = append(equipmentList, equipment)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading equipment"})
	}
	return c.JSON(equipmentList)
}

func CreateEquipment(c fiber.Ctx) error {
	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to determine laboratory access"})
	}

	var equipment models.Equipment
	if err := c.Bind().Body(&equipment); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if equipment.LaboratoryID <= 0 || equipment.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Laboratory ID and equipment name are required"})
	}

	if !scopeAllowsLaboratory(scope, equipment.LaboratoryID) {
		return laboratoryAccessDenied(c)
	}

	equipment.Status = strings.ToUpper(strings.TrimSpace(equipment.Status))
	if equipment.Status == "" {
		equipment.Status = "AVAILABLE"
	}
	if equipment.Status != "AVAILABLE" &&
		equipment.Status != "IN_USE" &&
		equipment.Status != "MAINTENANCE" {
		return c.Status(400).JSON(fiber.Map{"error": "Status must be AVAILABLE, IN_USE, or MAINTENANCE"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = database.DB.QueryRow(ctx, `
		INSERT INTO equipment
			(laboratory_id, name, category, serial_number, status, location, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`,
		equipment.LaboratoryID,
		equipment.Name,
		equipment.Category,
		equipment.SerialNumber,
		equipment.Status,
		equipment.Location,
		equipment.Description,
	).Scan(&equipment.ID, &equipment.CreatedAt)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create equipment"})
	}
	return c.Status(201).JSON(equipment)
}
