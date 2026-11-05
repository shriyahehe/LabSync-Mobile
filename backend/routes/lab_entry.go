package routes

import (
	"labsync/backend/handlers"

	"github.com/gofiber/fiber/v3"
)

func LabEntryRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/lab-entries/active", handlers.GetActiveLabEntries)
	api.Get("/lab-entries", handlers.GetLabEntries)
	api.Post("/lab-entries/check-in", handlers.CheckInLabEntry)
	api.Post("/lab-entries/:id/check-out", handlers.CheckOutLabEntry)
}
