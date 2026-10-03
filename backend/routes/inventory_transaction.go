package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// InventoryTransactionRoutes registers inventory transaction routes.
func InventoryTransactionRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Get transaction history
	api.Get(
		"/inventory-transactions",
		handlers.GetInventoryTransactions,
	)

	// Create a new usage/restock transaction
	api.Post(
		"/inventory-transactions",
		handlers.CreateInventoryTransaction,
	)
}
