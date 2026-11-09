package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func MaterialRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/materials",
		middleware.RequirePermission("materials.read"),
		handlers.GetMaterials,
	)
	api.Post("/materials",
		middleware.RequirePermission("materials.manage"),
		handlers.CreateMaterial,
	)
}
