package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
	"labsync/backend/middleware"
)

func AuthRoutes(app *fiber.App) {
	auth := app.Group("/api/auth")

	// Public routes.
	auth.Post("/login", handlers.AuthLogin)
	auth.Post("/refresh", handlers.AuthRefresh)

	// Protected route.
	auth.Post("/logout", middleware.RequireAuth, handlers.AuthLogout)
}
