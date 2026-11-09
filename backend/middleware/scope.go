package middleware

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
)

type AccessScope struct {
	AllLaboratories bool
	DepartmentIDs   []int
	LaboratoryIDs   []int
}

// GetUserAccessScope calculates the effective laboratory access of a user.
//
// SUPER_ADMIN: all laboratories.
// FACULTY: all laboratories in assigned departments.
// LAB_COORDINATOR: explicitly assigned laboratories.
// PHD_SCHOLAR: explicitly assigned laboratories.
// RESEARCH_SCHOLAR: explicitly assigned laboratories.
//
// When multiple non-admin roles exist, their permitted laboratory
// scopes are combined.
func GetUserAccessScope(ctx context.Context, userID int64) (*AccessScope, error) {
	scope := &AccessScope{
		DepartmentIDs: []int{},
		LaboratoryIDs: []int{},
	}

	// Retrieve user roles.
	roleRows, err := database.DB.Query(ctx, `
		SELECT r.name
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		JOIN users u ON u.id = ur.user_id
		WHERE ur.user_id = $1
		AND u.active = TRUE
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve user roles: %w", err)
	}

	hasFaculty := false

	for roleRows.Next() {
		var role string

		if err := roleRows.Scan(&role); err != nil {
			roleRows.Close()
			return nil, err
		}

		switch role {
		case "SUPER_ADMIN":
			scope.AllLaboratories = true
		case "FACULTY":
			hasFaculty = true
		}
	}

	if err := roleRows.Err(); err != nil {
		roleRows.Close()
		return nil, err
	}

	roleRows.Close()

	if scope.AllLaboratories {
		return scope, nil
	}

	// Retrieve assigned departments.
	departmentRows, err := database.DB.Query(ctx, `
		SELECT department_id
		FROM user_departments
		WHERE user_id = $1
		ORDER BY department_id
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve departments: %w", err)
	}

	for departmentRows.Next() {
		var departmentID int

		if err := departmentRows.Scan(&departmentID); err != nil {
			departmentRows.Close()
			return nil, err
		}

		scope.DepartmentIDs = append(
			scope.DepartmentIDs,
			departmentID,
		)
	}

	if err := departmentRows.Err(); err != nil {
		departmentRows.Close()
		return nil, err
	}

	departmentRows.Close()

	// Retrieve explicitly assigned laboratories.
	labRows, err := database.DB.Query(ctx, `
		SELECT laboratory_id
		FROM user_laboratories
		WHERE user_id = $1
		ORDER BY laboratory_id
	`, userID)

	if err != nil {
		return nil, fmt.Errorf("failed to retrieve laboratories: %w", err)
	}

	for labRows.Next() {
		var laboratoryID int

		if err := labRows.Scan(&laboratoryID); err != nil {
			labRows.Close()
			return nil, err
		}

		scope.LaboratoryIDs = appendUnique(
			scope.LaboratoryIDs,
			laboratoryID,
		)
	}

	if err := labRows.Err(); err != nil {
		labRows.Close()
		return nil, err
	}

	labRows.Close()

	// Faculty inherit access to all laboratories in their departments.
	if hasFaculty && len(scope.DepartmentIDs) > 0 {
		facultyRows, err := database.DB.Query(ctx, `
			SELECT id
			FROM laboratories
			WHERE department_id = ANY($1::integer[])
			ORDER BY id
		`, scope.DepartmentIDs)

		if err != nil {
			return nil, fmt.Errorf(
				"failed to retrieve faculty laboratories: %w",
				err,
			)
		}

		for facultyRows.Next() {
			var laboratoryID int

			if err := facultyRows.Scan(&laboratoryID); err != nil {
				facultyRows.Close()
				return nil, err
			}

			scope.LaboratoryIDs = appendUnique(
				scope.LaboratoryIDs,
				laboratoryID,
			)
		}

		if err := facultyRows.Err(); err != nil {
			facultyRows.Close()
			return nil, err
		}

		facultyRows.Close()
	}

	return scope, nil
}

// appendUnique prevents duplicate laboratory IDs.
func appendUnique(values []int, value int) []int {
	for _, existing := range values {
		if existing == value {
			return values
		}
	}

	return append(values, value)
}

// RequireLaboratoryAccess checks whether the authenticated user
// can access the laboratory ID supplied as a URL parameter.
//
// Example: RequireLaboratoryAccess("id")
func RequireLaboratoryAccess(paramName string) fiber.Handler {
	return func(c fiber.Ctx) error {
		userID, ok := c.Locals("userID").(int64)

		if !ok {
			return c.Status(401).JSON(fiber.Map{
				"error": "Authentication required",
			})
		}

		// Parse laboratory ID from URL parameter.
		labID, err := strconv.Atoi(c.Params(paramName))

		if err != nil || labID <= 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid laboratory ID",
			})
		}

		ctx, cancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancel()

		scope, err := GetUserAccessScope(ctx, userID)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to verify laboratory access",
			})
		}

		// Super Admin can access every laboratory.
		if scope.AllLaboratories {
			return c.Next()
		}

		// Check effective laboratory assignments.
		for _, allowedID := range scope.LaboratoryIDs {
			if allowedID == labID {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{
			"error": "You do not have access to this laboratory",
		})
	}
}
