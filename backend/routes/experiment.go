package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func ExperimentRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/experiments",
		middleware.RequirePermission("experiments.read"),
		handlers.GetExperiments,
	)
	api.Get("/experiments/:id",
		middleware.RequirePermission("experiments.read"),
		handlers.GetExperiment,
	)
	api.Post("/experiments",
		middleware.RequirePermission("experiments.manage"),
		handlers.CreateExperiment,
	)
	api.Put("/experiments/:id",
		middleware.RequirePermission("experiments.manage"),
		handlers.UpdateExperiment,
	)
	api.Post("/experiments/:id/records",
		middleware.RequirePermission("experiments.manage"),
		handlers.CreateExperimentRecord,
	)
	api.Get("/experiments/:id/records",
		middleware.RequirePermission("experiments.read"),
		handlers.GetExperimentRecords,
	)
}
