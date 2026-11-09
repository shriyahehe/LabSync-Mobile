package handlers

import (
	"context"
	"errors"

	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/middleware"
)

// authenticatedActorID returns the user ID established by RequireAuth.
// Never accept this value from the request body.
func authenticatedActorID(c fiber.Ctx) (int64, error) {
	userID, ok := c.Locals("userID").(int64)
	if !ok || userID <= 0 {
		return 0, errors.New("authenticated user ID is missing")
	}
	return userID, nil
}

// laboratoryAccessDenied sends a consistent authorization response.
func laboratoryAccessDenied(c fiber.Ctx) error {
	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"error": "You do not have access to this laboratory",
	})
}

// requestAccessScope returns the authenticated user and their effective scope.
func requestAccessScope(c fiber.Ctx) (int64, *middleware.AccessScope, error) {
	userID, err := authenticatedActorID(c)
	if err != nil {
		return 0, nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	scope, err := middleware.GetUserAccessScope(ctx, userID)
	if err != nil {
		return 0, nil, err
	}

	return userID, scope, nil
}

func scopeAllowsLaboratory(scope *middleware.AccessScope, laboratoryID int) bool {
	if scope == nil || laboratoryID <= 0 {
		return false
	}
	if scope.AllLaboratories {
		return true
	}
	for _, allowedID := range scope.LaboratoryIDs {
		if allowedID == laboratoryID {
			return true
		}
	}
	return false
}
