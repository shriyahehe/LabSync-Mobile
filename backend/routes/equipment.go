package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func EquipmentRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/equipment",
		middleware.RequirePermission("equipment.read"),
		handlers.GetEquipment,
	)
	api.Post("/equipment",
		middleware.RequirePermission("equipment.manage"),
		handlers.CreateEquipment,
	)
}
