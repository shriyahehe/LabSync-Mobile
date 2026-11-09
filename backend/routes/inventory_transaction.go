package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func InventoryTransactionRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/inventory-transactions",
		middleware.RequirePermission("materials.read"),
		handlers.GetInventoryTransactions,
	)
	api.Post("/inventory-transactions",
		middleware.RequirePermission("inventory_transactions.manage"),
		handlers.CreateInventoryTransaction,
	)
}
