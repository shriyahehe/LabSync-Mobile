package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func EquipmentTransactionRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/equipment-transactions",
		middleware.RequirePermission("equipment.read"),
		handlers.GetEquipmentTransactions,
	)
	api.Post("/equipment-transactions",
		middleware.RequirePermission("equipment_transactions.manage"),
		handlers.CreateEquipmentTransaction,
	)
}
