package handlers

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"

	"labsync/backend/database"
	"labsync/backend/models"
)

func GetLaboratories(c fiber.Ctx) error {
	ctx := context.Background()

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine access permissions",
		})
	}

	rows, err := database.DB.Query(ctx, `
		SELECT id, name, department, location
		FROM laboratories
		WHERE ($1::boolean OR id = ANY($2::integer[]))
		ORDER BY name
	`, scope.AllLaboratories, scope.LaboratoryIDs)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to fetch laboratories",
		})
	}
	defer rows.Close()

	laboratories := make([]models.Laboratory, 0)

	for rows.Next() {
		var laboratory models.Laboratory

		if err := rows.Scan(
			&laboratory.ID,
			&laboratory.Name,
			&laboratory.Department,
			&laboratory.Location,
		); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to read laboratory data",
			})
		}

		laboratories = append(laboratories, laboratory)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Error while reading laboratories",
		})
	}

	return c.JSON(fiber.Map{
		"laboratories": laboratories,
		"total":        len(laboratories),
	})
}

func CreateLaboratory(c fiber.Ctx) error {
	ctx := context.Background()

	_, scope, err := requestAccessScope(c)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to determine access permissions",
		})
	}

	// Only Super Admin can create laboratories.
	if !scope.AllLaboratories {
		return c.Status(403).JSON(fiber.Map{
			"error": "You are not authorized to create laboratories",
		})
	}

	var request struct {
		Name         string `json:"name"`
		Department   string `json:"department"`
		DepartmentID int    `json:"department_id"`
		Location     string `json:"location"`
	}

	if err := c.Bind().Body(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	request.Name = strings.TrimSpace(request.Name)
	request.Department = strings.TrimSpace(request.Department)
	request.Location = strings.TrimSpace(request.Location)

	if request.Name == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Laboratory name is required",
		})
	}

	if request.Department == "" && request.DepartmentID <= 0 {
		return c.Status(400).JSON(fiber.Map{
			"error": "Department or department_id is required",
		})
	}

	var departmentID int
	var departmentName string

	if request.DepartmentID > 0 {
		err = database.DB.QueryRow(ctx, `
			SELECT id, name
			FROM departments
			WHERE id = $1
		`, request.DepartmentID).Scan(&departmentID, &departmentName)
	} else {
		err = database.DB.QueryRow(ctx, `
			SELECT id, name
			FROM departments
			WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
			   OR LOWER(TRIM(code)) = LOWER(TRIM($1))
			LIMIT 1
		`, request.Department).Scan(&departmentID, &departmentName)
	}

	if err == pgx.ErrNoRows {
		return c.Status(400).JSON(fiber.Map{
			"error": "Department not found",
		})
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to find department",
		})
	}

	var laboratory models.Laboratory

	err = database.DB.QueryRow(ctx, `
		INSERT INTO laboratories (
			name,
			department,
			department_id,
			location
		)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, department, location
	`,
		request.Name,
		departmentName,
		departmentID,
		request.Location,
	).Scan(
		&laboratory.ID,
		&laboratory.Name,
		&laboratory.Department,
		&laboratory.Location,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create laboratory",
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"message":    "Laboratory created successfully",
		"laboratory": laboratory,
	})
}
