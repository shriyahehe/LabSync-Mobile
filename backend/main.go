package main

import (
	"log"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/routes"
)

func main() {
	// Connect to PostgreSQL using a connection pool.
	if err := database.Connect(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	// Close all database connections when the application exits.
	defer database.Close()

	app := fiber.New()

	// Register API routes.
	routes.LaboratoryRoutes(app)
	routes.MaterialRoutes(app)
	routes.InventoryTransactionRoutes(app)
	routes.EquipmentRoutes(app)
	routes.EquipmentTransactionRoutes(app)
	routes.ExperimentRoutes(app)
	routes.LabEntryRoutes(app)
	routes.SampleRoutes(app)

	// Home route.
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "LabSync Backend is running",
		})
	})

	// Health check.
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	// Start the server.
	if err := app.Listen(":8080"); err != nil {
		log.Printf("Server stopped: %v", err)
	}
}
