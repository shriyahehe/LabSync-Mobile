package handlers

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"

	"labsync/backend/database"
	"labsync/backend/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

const researcherSelect = `
	SELECT r.id, r.researcher_code, r.full_name, r.email, r.phone,
	       r.researcher_type, r.department, r.research_area,
	       r.primary_laboratory_id, l.name, r.supervisor_name,
	       r.joining_date::text, r.status, r.created_at, r.updated_at
	FROM researchers r
	JOIN laboratories l ON l.id = r.primary_laboratory_id
`

func scanResearcher(row pgx.Row) (models.Researcher, error) {
	var researcher models.Researcher

	err := row.Scan(
		&researcher.ID,
		&researcher.ResearcherCode,
		&researcher.FullName,
		&researcher.Email,
		&researcher.Phone,
		&researcher.ResearcherType,
		&researcher.Department,
		&researcher.ResearchArea,
		&researcher.PrimaryLaboratoryID,
		&researcher.PrimaryLaboratory,
		&researcher.SupervisorName,
		&researcher.JoiningDate,
		&researcher.Status,
		&researcher.CreatedAt,
		&researcher.UpdatedAt,
	)

	return researcher, err
}

// GetResearchers returns all researchers with optional search and filters.
func GetResearchers(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	search := strings.TrimSpace(c.Query("search"))
	researcherType := strings.ToUpper(strings.TrimSpace(c.Query("type")))
	status := strings.ToUpper(strings.TrimSpace(c.Query("status")))
	laboratoryID := strings.TrimSpace(c.Query("laboratory_id"))

	if researcherType != "" &&
		researcherType != "RESEARCH_SCHOLAR" &&
		researcherType != "PHD_SCHOLAR" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid researcher type"})
	}

	if status != "" && status != "ACTIVE" && status != "INACTIVE" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid researcher status"})
	}

	var labID *int
	if laboratoryID != "" {
		id, err := strconv.Atoi(laboratoryID)
		if err != nil || id <= 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid laboratory ID"})
		}
		labID = &id
	}

	rows, err := database.DB.Query(ctx, `
		SELECT r.id, r.researcher_code, r.full_name, r.email, r.phone,
		       r.researcher_type, r.department, r.research_area,
		       r.primary_laboratory_id, l.name, r.supervisor_name,
		       r.joining_date::text, r.status, r.created_at, r.updated_at
		FROM researchers r
		JOIN laboratories l ON l.id = r.primary_laboratory_id
		WHERE ($1 = '' OR r.full_name ILIKE '%' || $1 || '%'
		       OR r.researcher_code ILIKE '%' || $1 || '%'
		       OR COALESCE(r.email, '') ILIKE '%' || $1 || '%')
		  AND ($2 = '' OR r.researcher_type = $2)
		  AND ($3 = '' OR r.status = $3)
		  AND ($4::integer IS NULL OR r.primary_laboratory_id = $4)
		ORDER BY r.created_at DESC, r.id DESC
	`, search, researcherType, status, labID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch researchers"})
	}
	defer rows.Close()

	researchers := make([]models.Researcher, 0)

	for rows.Next() {
		researcher, err := scanResearcher(rows)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to read researcher data"})
		}
		researchers = append(researchers, researcher)
	}

	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed while reading researchers"})
	}

	return c.JSON(researchers)
}

// GetResearcher returns one researcher by ID.
func GetResearcher(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid researcher ID"})
	}

	researcher, err := scanResearcher(database.DB.QueryRow(
		ctx,
		researcherSelect+` WHERE r.id = $1`,
		id,
	))

	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(404).JSON(fiber.Map{"error": "Researcher not found"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch researcher"})
	}

	return c.JSON(researcher)
}

type researcherInput struct {
	ResearcherCode      string  `json:"researcher_code"`
	FullName            string  `json:"full_name"`
	Email               *string `json:"email"`
	Phone               *string `json:"phone"`
	ResearcherType      string  `json:"researcher_type"`
	Department          *string `json:"department"`
	ResearchArea        *string `json:"research_area"`
	PrimaryLaboratoryID int     `json:"primary_laboratory_id"`
	SupervisorName      *string `json:"supervisor_name"`
	JoiningDate         *string `json:"joining_date"`
	Status              string  `json:"status"`
}

func validateResearcher(input *researcherInput) error {
	input.ResearcherCode = strings.TrimSpace(input.ResearcherCode)
	input.FullName = strings.TrimSpace(input.FullName)
	input.ResearcherType = strings.ToUpper(strings.TrimSpace(input.ResearcherType))
	input.Status = strings.ToUpper(strings.TrimSpace(input.Status))

	if input.ResearcherCode == "" || input.FullName == "" {
		return errors.New("researcher code and full name are required")
	}

	if input.PrimaryLaboratoryID <= 0 {
		return errors.New("primary laboratory is required")
	}

	if input.ResearcherType != "RESEARCH_SCHOLAR" &&
		input.ResearcherType != "PHD_SCHOLAR" {
		return errors.New("researcher type must be RESEARCH_SCHOLAR or PHD_SCHOLAR")
	}

	if input.Status == "" {
		input.Status = "ACTIVE"
	}
	if input.Status != "ACTIVE" && input.Status != "INACTIVE" {
		return errors.New("status must be ACTIVE or INACTIVE")
	}

	if input.Email != nil {
		value := strings.TrimSpace(*input.Email)
		if value == "" {
			input.Email = nil
		} else {
			input.Email = &value
		}
	}

	if input.Phone != nil {
		value := strings.TrimSpace(*input.Phone)
		if value == "" {
			input.Phone = nil
		} else {
			input.Phone = &value
		}
	}

	if input.JoiningDate != nil {
		value := strings.TrimSpace(*input.JoiningDate)
		if value == "" {
			input.JoiningDate = nil
		} else if _, err := time.Parse("2006-01-02", value); err != nil {
			return errors.New("joining_date must use YYYY-MM-DD format")
		} else {
			input.JoiningDate = &value
		}
	}

	return nil
}

func researcherDBError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return errors.New("researcher code or email already exists")
		case "23503":
			return errors.New("selected laboratory does not exist")
		}
	}
	return err
}

// CreateResearcher creates a researcher and their primary lab record.
func CreateResearcher(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input researcherInput
	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validateResearcher(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback(ctx)

	var researcherID int

	err = tx.QueryRow(ctx, `
		INSERT INTO researchers (
			researcher_code, full_name, email, phone, researcher_type,
			department, research_area, primary_laboratory_id,
			supervisor_name, joining_date, status
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id
	`,
		input.ResearcherCode,
		input.FullName,
		input.Email,
		input.Phone,
		input.ResearcherType,
		input.Department,
		input.ResearchArea,
		input.PrimaryLaboratoryID,
		input.SupervisorName,
		input.JoiningDate,
		input.Status,
	).Scan(&researcherID)

	if err != nil {
		err = researcherDBError(err)
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO researcher_laboratories (
			researcher_id, laboratory_id, is_primary, status
		)
		VALUES ($1, $2, TRUE, 'ACTIVE')
	`, researcherID, input.PrimaryLaboratoryID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save primary laboratory"})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save researcher"})
	}

	researcher, err := scanResearcher(database.DB.QueryRow(
		ctx,
		researcherSelect+` WHERE r.id = $1`,
		researcherID,
	))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Researcher created but failed to fetch response"})
	}

	return c.Status(201).JSON(researcher)
}

// UpdateResearcher updates an existing researcher profile.
func UpdateResearcher(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid researcher ID"})
	}

	var input researcherInput
	if err := c.Bind().Body(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if err := validateResearcher(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback(ctx)

	command, err := tx.Exec(ctx, `
		UPDATE researchers
		SET researcher_code = $1,
		    full_name = $2,
		    email = $3,
		    phone = $4,
		    researcher_type = $5,
		    department = $6,
		    research_area = $7,
		    primary_laboratory_id = $8,
		    supervisor_name = $9,
		    joining_date = $10,
		    status = $11,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $12
	`,
		input.ResearcherCode,
		input.FullName,
		input.Email,
		input.Phone,
		input.ResearcherType,
		input.Department,
		input.ResearchArea,
		input.PrimaryLaboratoryID,
		input.SupervisorName,
		input.JoiningDate,
		input.Status,
		id,
	)

	if err != nil {
		err = researcherDBError(err)
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if command.RowsAffected() == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Researcher not found"})
	}

	// Keep the single primary laboratory assignment in sync.
	_, err = tx.Exec(ctx, `
		UPDATE researcher_laboratories
		SET laboratory_id = $1, assigned_at = CURRENT_TIMESTAMP, status = 'ACTIVE'
		WHERE researcher_id = $2 AND is_primary = TRUE
	`, input.PrimaryLaboratoryID, id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update primary laboratory"})
	}

	if err := tx.Commit(ctx); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update researcher"})
	}

	researcher, err := scanResearcher(database.DB.QueryRow(
		ctx,
		researcherSelect+` WHERE r.id = $1`,
		id,
	))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Researcher updated but failed to fetch response"})
	}

	return c.JSON(researcher)
}
