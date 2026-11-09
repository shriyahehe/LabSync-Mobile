package middleware

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/auth"
)

func RequireAuth(c fiber.Ctx) error {
	header := c.Get("Authorization")

	if !strings.HasPrefix(header, "Bearer ") {
		return c.Status(401).JSON(fiber.Map{
			"error": "Authentication required",
		})
	}

	tokenString := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))

	if tokenString == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid authorization header",
		})
	}

	claims, err := auth.ValidateAccessToken(tokenString)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid or expired access token",
		})
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	userID, err := auth.ValidateSession(ctx, claims)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Session expired or revoked",
		})
	}

	c.Locals("userID", userID)
	c.Locals("sessionID", claims.SessionID)
	c.Locals("roles", claims.Roles)

	return c.Next()
}
