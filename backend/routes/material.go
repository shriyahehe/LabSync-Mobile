package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// MaterialRoutes registers all material-related API routes.
func MaterialRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Get all materials
	api.Get("/materials", handlers.GetMaterials)

	// Create a new material
	api.Post("/materials", handlers.CreateMaterial)
}
