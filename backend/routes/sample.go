package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func SampleRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/samples",
		middleware.RequirePermission("samples.read"),
		handlers.GetSamples,
	)
	api.Get("/samples/:id",
		middleware.RequirePermission("samples.read"),
		handlers.GetSample,
	)
	api.Post("/samples",
		middleware.RequirePermission("samples.manage"),
		handlers.CreateSample,
	)
	api.Get("/sample-transactions",
		middleware.RequirePermission("samples.read"),
		handlers.GetSampleTransactions,
	)
	api.Post("/sample-transactions",
		middleware.RequirePermission("samples.manage"),
		handlers.CreateSampleTransaction,
	)
}
