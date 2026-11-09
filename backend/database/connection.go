package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() error {
	connectionString := os.Getenv("DATABASE_URL")
	if connectionString == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return fmt.Errorf("failed to parse database configuration: %w", err)
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return fmt.Errorf("failed to create database pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	var databaseName string
	var databaseUser string

	err = pool.QueryRow(ctx,
		"SELECT current_database(), current_user",
	).Scan(&databaseName, &databaseUser)

	if err != nil {
		pool.Close()
		return fmt.Errorf("failed to identify connected database: %w", err)
	}

	DB = pool

	fmt.Printf(
		"Connected to PostgreSQL | Database: %s | User: %s\n",
		databaseName,
		databaseUser,
	)

	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
		fmt.Println("PostgreSQL connection pool closed.")
	}
}
