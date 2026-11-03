package models

import "time"

type LabEntry struct {
	ID             int        `json:"id"`
	LaboratoryID   int        `json:"laboratory_id"`
	LaboratoryName string     `json:"laboratory_name,omitempty"`
	ResearcherName string     `json:"researcher_name"`
	CheckIn        time.Time  `json:"check_in"`
	CheckOut       *time.Time `json:"check_out"`
	Notes          string     `json:"notes"`
	CreatedAt      time.Time  `json:"created_at"`
}

type CreateLabEntryInput struct {
	LaboratoryID   int    `json:"laboratory_id"`
	ResearcherName string `json:"researcher_name"`
	Notes          string `json:"notes"`
}
