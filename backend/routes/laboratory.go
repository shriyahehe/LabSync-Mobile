package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// LaboratoryRoutes registers all laboratory-related API routes.
func LaboratoryRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Get all laboratories
	api.Get("/laboratories", handlers.GetLaboratories)

	// Create a new laboratory
	api.Post("/laboratories", handlers.CreateLaboratory)
}
