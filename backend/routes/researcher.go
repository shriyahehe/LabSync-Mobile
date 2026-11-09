package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func ResearcherRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/researchers",
		middleware.RequirePermission("researchers.read"),
		handlers.GetResearchers,
	)
	api.Get("/researchers/:id/activity",
		middleware.RequirePermission("researchers.read"),
		handlers.GetResearcherActivity,
	)
	api.Get("/researchers/:id",
		middleware.RequirePermission("researchers.read"),
		handlers.GetResearcher,
	)
	api.Post("/researchers",
		middleware.RequirePermission("researchers.manage"),
		handlers.CreateResearcher,
	)
	api.Put("/researchers/:id",
		middleware.RequirePermission("researchers.manage"),
		handlers.UpdateResearcher,
	)
}
