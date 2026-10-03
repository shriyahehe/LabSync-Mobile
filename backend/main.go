package main

import (
	"log"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
)

func main() {

	// Connect to PostgreSQL
	database.Connect()

	app := fiber.New()

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

	log.Fatal(app.Listen(":8080"))
}
