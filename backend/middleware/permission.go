package middleware

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
)

// RequirePermission checks whether the authenticated user has a permission.
// Super Admin receives all permissions through role_permissions.
func RequirePermission(permissionCode string) fiber.Handler {
	return func(c fiber.Ctx) error {
		userID, ok := c.Locals("userID").(int64)
		if !ok {
			return c.Status(401).JSON(fiber.Map{
				"error": "Authentication required",
			})
		}

		ctx, cancel := context.WithTimeout(
			context.Background(),
			5*time.Second,
		)
		defer cancel()

		var allowed bool

		err := database.DB.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1
				FROM user_roles ur
				JOIN role_permissions rp ON rp.role_id = ur.role_id
				JOIN permissions p ON p.id = rp.permission_id
				JOIN users u ON u.id = ur.user_id
				WHERE ur.user_id = $1
				AND p.code = $2
				AND u.active = TRUE
			)
		`, userID, permissionCode).Scan(&allowed)

		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to verify permission",
			})
		}

		if !allowed {
			return c.Status(403).JSON(fiber.Map{
				"error": "You do not have permission to perform this action",
			})
		}

		return c.Next()
	}
}
