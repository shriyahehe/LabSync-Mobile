package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"labsync/backend/auth"
)

type DemoUser struct {
	Name         string
	Email        string
	Password     string
	Role         string
	DepartmentID int
	LaboratoryID int
}

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// Safety check: this program must never seed the production database.
	if !strings.Contains(dbURL, "labsync_auth_test") {
		log.Fatal("Safety stop: DATABASE_URL must point to labsync_auth_test")
	}

	ctx := context.Background()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	defer conn.Close(ctx)

	var databaseName string
	if err := conn.QueryRow(ctx, "SELECT current_database()").Scan(&databaseName); err != nil {
		log.Fatal(err)
	}
	if databaseName != "labsync_auth_test" {
		log.Fatalf("Safety stop: connected to unexpected database %q", databaseName)
	}

	users := []DemoUser{
		{"Demo Admin 1", "admin1@labsync.demo", "LabSyncDemo!2026A", "SUPER_ADMIN", 0, 0},
		{"Demo Admin 2", "admin2@labsync.demo", "LabSyncDemo!2026B", "SUPER_ADMIN", 0, 0},

		{"Demo Coordinator 1", "coordinator1@labsync.demo", "LabSyncDemo!2026C", "LAB_COORDINATOR", 1, 1},
		{"Demo Coordinator 2", "coordinator2@labsync.demo", "LabSyncDemo!2026D", "LAB_COORDINATOR", 3, 3},

		{"Demo Faculty 1", "faculty1@labsync.demo", "LabSyncDemo!2026E", "FACULTY", 1, 0},
		{"Demo Faculty 2", "faculty2@labsync.demo", "LabSyncDemo!2026F", "FACULTY", 4, 0},

		{"Demo PhD 1", "phd1@labsync.demo", "LabSyncDemo!2026G", "PHD_SCHOLAR", 2, 2},
		{"Demo PhD 2", "phd2@labsync.demo", "LabSyncDemo!2026H", "PHD_SCHOLAR", 3, 3},

		{"Demo Researcher 1", "researcher1@labsync.demo", "LabSyncDemo!2026I", "RESEARCH_SCHOLAR", 5, 5},
		{"Demo Researcher 2", "researcher2@labsync.demo", "LabSyncDemo!2026J", "RESEARCH_SCHOLAR", 1, 1},
	}

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer tx.Rollback(ctx)

	for _, user := range users {
		hash, err := auth.HashPassword(user.Password)
		if err != nil {
			log.Fatal("Password hashing failed: ", err)
		}

		var userID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO users
				(full_name, email, password_hash, active, must_change_password)
			VALUES ($1, LOWER($2), $3, TRUE, FALSE)
			ON CONFLICT (LOWER(email))
			DO UPDATE SET
				full_name = EXCLUDED.full_name,
				password_hash = EXCLUDED.password_hash,
				active = TRUE,
				must_change_password = FALSE,
				updated_at = CURRENT_TIMESTAMP
			RETURNING id
		`, user.Name, user.Email, hash).Scan(&userID)
		if err != nil {
			log.Fatalf("Could not create user %s: %v", user.Email, err)
		}

		var roleID int
		err = tx.QueryRow(ctx,
			`SELECT id FROM roles WHERE name = $1`,
			user.Role,
		).Scan(&roleID)
		if err != nil {
			log.Fatalf("Role %s not found: %v", user.Role, err)
		}

		// Demo accounts are managed by the seed, so replace only their role assignment.
		if _, err := tx.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID); err != nil {
			log.Fatal(err)
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO user_roles (user_id, role_id)
			VALUES ($1, $2)
		`, userID, roleID); err != nil {
			log.Fatalf("Could not assign role to %s: %v", user.Email, err)
		}

		// Replace only department/lab scope assignments for this demo account.
		if _, err := tx.Exec(ctx, `DELETE FROM user_departments WHERE user_id = $1`, userID); err != nil {
			log.Fatal(err)
		}
		if _, err := tx.Exec(ctx, `DELETE FROM user_laboratories WHERE user_id = $1`, userID); err != nil {
			log.Fatal(err)
		}

		if user.DepartmentID != 0 {
			if _, err := tx.Exec(ctx, `
				INSERT INTO user_departments (user_id, department_id)
				VALUES ($1, $2)
			`, userID, user.DepartmentID); err != nil {
				log.Fatalf("Department assignment failed for %s: %v", user.Email, err)
			}
		}

		if user.LaboratoryID != 0 {
			if _, err := tx.Exec(ctx, `
				INSERT INTO user_laboratories (user_id, laboratory_id)
				VALUES ($1, $2)
			`, userID, user.LaboratoryID); err != nil {
				log.Fatalf("Laboratory assignment failed for %s: %v", user.Email, err)
			}
		}

		fmt.Printf("Seeded: %-34s role=%s\n", user.Email, user.Role)
	}

	if err := tx.Commit(ctx); err != nil {
		log.Fatal("Seed transaction failed: ", err)
	}

	fmt.Println("\nSuccessfully seeded 10 LabSync demo accounts.")
}
