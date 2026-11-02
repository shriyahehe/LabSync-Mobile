package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

func ExperimentRoutes(app *fiber.App) {
	app.Get("/api/experiments", handlers.GetExperiments)
	app.Get("/api/experiments/:id", handlers.GetExperiment)
	app.Post("/api/experiments", handlers.CreateExperiment)
	app.Put("/api/experiments/:id", handlers.UpdateExperiment)

	app.Post("/api/experiments/:id/records", handlers.CreateExperimentRecord)
	app.Get("/api/experiments/:id/records", handlers.GetExperimentRecords)
}
