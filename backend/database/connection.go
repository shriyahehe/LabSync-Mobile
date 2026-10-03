package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

var DB *pgx.Conn

func Connect() {
	var err error

	DB, err = pgx.Connect(
		context.Background(),
		"postgres://localhost/labsync",
	)

	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	fmt.Println("Connected to PostgreSQL!")
}
