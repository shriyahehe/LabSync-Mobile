package main

import (
	"log"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/routes"
)

func main() {
	// Connect to PostgreSQL
	database.Connect()

	app := fiber.New()

	// Register API routes
	routes.LaboratoryRoutes(app)
	routes.MaterialRoutes(app)
	routes.InventoryTransactionRoutes(app)
	routes.EquipmentRoutes(app)
	routes.EquipmentTransactionRoutes(app)

	// Home route
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "LabSync Backend is running",
		})
	})

	// Health check
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	log.Fatal(app.Listen(":8080"))
}
