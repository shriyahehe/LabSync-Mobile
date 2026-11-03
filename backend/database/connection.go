package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB is the shared PostgreSQL connection pool.
var DB *pgxpool.Pool

// Connect initializes and verifies the PostgreSQL connection pool.
func Connect() error {
	connectionString := "postgres://postgres:iu16051993@localhost:5432/labsync?sslmode=disable"

	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return fmt.Errorf("failed to parse database configuration: %w", err)
	}

	// Configure the connection pool.
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(
		context.Background(),
		config,
	)
	if err != nil {
		return fmt.Errorf("failed to create database pool: %w", err)
	}

	// Verify that PostgreSQL is reachable.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	DB = pool

	fmt.Println("Connected to PostgreSQL using connection pool!")

	return nil
}

// Close releases all connections in the pool.
func Close() {
	if DB != nil {
		DB.Close()
		fmt.Println("PostgreSQL connection pool closed.")
	}
}
