package routes

import (
	"github.com/gofiber/fiber/v3"
	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func LabEntryRoutes(app *fiber.App) {
	api := app.Group("/api", middleware.RequireAuth)

	api.Get("/lab-entries/active",
		middleware.RequirePermission("lab_entries.read"),
		handlers.GetActiveLabEntries,
	)
	api.Get("/lab-entries",
		middleware.RequirePermission("lab_entries.read"),
		handlers.GetLabEntries,
	)
	api.Post("/lab-entries/check-in",
		middleware.RequirePermission("lab_entries.manage"),
		handlers.CheckInLabEntry,
	)
	api.Post("/lab-entries/:id/check-out",
		middleware.RequirePermission("lab_entries.manage"),
		handlers.CheckOutLabEntry,
	)
}
