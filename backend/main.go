package main

import (
	"log"

	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()

	// Home route
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "LabSync Backend is running",
		})
	})

	// Health check route
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	log.Fatal(app.Listen(":8080"))
}