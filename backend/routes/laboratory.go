package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func LaboratoryRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/laboratories",
		middleware.RequirePermission("laboratories.read"),
		handlers.GetLaboratories,
	)
	api.Post("/laboratories",
		middleware.RequirePermission("laboratories.manage"),
		handlers.CreateLaboratory,
	)
}
