package models

import "time"

type Experiment struct {
	ID           int        `json:"id"`
	LaboratoryID int        `json:"laboratory_id"`
	ResearcherID *int       `json:"researcher_id,omitempty"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	StartedBy    string     `json:"started_by"`
	Status       string     `json:"status"`
	StartTime    *time.Time `json:"start_time"`
	EndTime      *time.Time `json:"end_time"`
	CreatedAt    time.Time  `json:"created_at"`
}
