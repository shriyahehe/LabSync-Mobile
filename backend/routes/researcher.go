package routes

import (
	"github.com/gofiber/fiber/v3"

	"labsync/backend/handlers"
)

func ResearcherRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/researchers", handlers.GetResearchers)
	api.Get("/researchers/:id/activity", handlers.GetResearcherActivity)
	api.Get("/researchers/:id", handlers.GetResearcher)
	api.Post("/researchers", handlers.CreateResearcher)
	api.Put("/researchers/:id", handlers.UpdateResearcher)
}
