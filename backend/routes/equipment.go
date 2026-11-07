package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// EquipmentRoutes registers all equipment-related API routes.
func EquipmentRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Get all equipment
	api.Get("/equipment", handlers.GetEquipment)

	// Create new equipment
	api.Post("/equipment", handlers.CreateEquipment)
}
