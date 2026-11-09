package handlers

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/auth"
)

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func AuthLogin(c fiber.Ctx) error {
	var req auth.LoginRequest

	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	ctx, cancel := context.WithTimeout(
		c.Context(),
		5*time.Second,
	)
	defer cancel()

	result, err := auth.Login(ctx, req)
	if err != nil {
		log.Printf("AUTH LOGIN FAILURE: %v", err)

		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	return c.JSON(result)
}

func AuthRefresh(c fiber.Ctx) error {
	var req refreshRequest

	if err := c.Bind().Body(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	ctx, cancel := context.WithTimeout(
		c.Context(),
		5*time.Second,
	)
	defer cancel()

	result, err := auth.RefreshSession(ctx, req.RefreshToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid or expired refresh token",
		})
	}

	return c.JSON(result)
}

func AuthLogout(c fiber.Ctx) error {
	userIDValue := c.Locals("userID")
	sessionIDValue := c.Locals("sessionID")

	userID, ok := userIDValue.(int64)
	if !ok {
		return c.SendStatus(401)
	}

	sessionID, ok := sessionIDValue.(string)
	if !ok || strings.TrimSpace(sessionID) == "" {
		return c.SendStatus(401)
	}

	ctx, cancel := context.WithTimeout(
		c.Context(),
		5*time.Second,
	)
	defer cancel()

	if err := auth.Logout(ctx, sessionID, userID); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Could not end session",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}
