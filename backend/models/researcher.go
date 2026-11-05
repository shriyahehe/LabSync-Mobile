package models

import "time"

type Researcher struct {
	ID                  int       `json:"id"`
	ResearcherCode      string    `json:"researcher_code"`
	FullName            string    `json:"full_name"`
	Email               *string   `json:"email"`
	Phone               *string   `json:"phone"`
	ResearcherType      string    `json:"researcher_type"`
	Department          *string   `json:"department"`
	ResearchArea        *string   `json:"research_area"`
	PrimaryLaboratoryID int       `json:"primary_laboratory_id"`
	PrimaryLaboratory   string    `json:"primary_laboratory,omitempty"`
	SupervisorName      *string   `json:"supervisor_name"`
	JoiningDate         *string   `json:"joining_date"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type ResearcherLaboratory struct {
	ID             int       `json:"id"`
	ResearcherID   int       `json:"researcher_id"`
	LaboratoryID   int       `json:"laboratory_id"`
	LaboratoryName string    `json:"laboratory_name,omitempty"`
	IsPrimary      bool      `json:"is_primary"`
	Status         string    `json:"status"`
	AssignedAt     time.Time `json:"assigned_at"`
}
