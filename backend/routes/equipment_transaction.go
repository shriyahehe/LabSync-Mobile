package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

// EquipmentTransactionRoutes registers equipment tracking routes.
func EquipmentTransactionRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Get equipment transaction history.
	api.Get(
		"/equipment-transactions",
		handlers.GetEquipmentTransactions,
	)

	// Checkout or return equipment.
	api.Post(
		"/equipment-transactions",
		handlers.CreateEquipmentTransaction,
	)
}
