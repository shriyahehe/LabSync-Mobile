package main

import (
	"log"

	"github.com/joho/godotenv"

	"labsync/backend/database"
)

func main() {
	// Load local environment variables.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found; using system environment variables")
	}

	// Connect to PostgreSQL.
	if err := database.Connect(); err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer database.Close()

	log.Println("Database connection successful.")
	log.Println("Migration runner entry point is ready.")
}
