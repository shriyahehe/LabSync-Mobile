package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// SampleRoutes registers all sample-related API routes.
func SampleRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/samples", handlers.GetSamples)
	api.Get("/samples/:id", handlers.GetSample)
	api.Post("/samples", handlers.CreateSample)

	api.Get("/sample-transactions", handlers.GetSampleTransactions)
	api.Post("/sample-transactions", handlers.CreateSampleTransaction)
}
