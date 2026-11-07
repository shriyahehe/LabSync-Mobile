package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/joho/godotenv"

	"labsync/backend/database"
	"labsync/backend/routes"
)

func main() {
	// Load local environment variables.
	// On deployment, variables can be provided by the hosting environment.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found; using system environment variables")
	}

	// Connect to PostgreSQL.
	if err := database.Connect(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
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
	routes.ResearcherRoutes(app)

	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "LabSync Backend is running",
		})
	})

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	// Start server using configured port.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := app.Listen(":" + port); err != nil {
		log.Printf("Server stopped: %v", err)
	}
}
