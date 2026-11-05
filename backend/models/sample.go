package models

import "time"

type Sample struct {
	ID                int       `json:"id"`
	LaboratoryID      int       `json:"laboratory_id"`
	Name              string    `json:"name"`
	SampleType        string    `json:"sample_type"`
	Description       string    `json:"description"`
	InitialQuantity   float64   `json:"initial_quantity"`
	AvailableQuantity float64   `json:"available_quantity"`
	Unit              string    `json:"unit"`
	StorageLocation   string    `json:"storage_location"`
	CreatedAt         time.Time `json:"created_at"`
}

type SampleTransaction struct {
	ID              int       `json:"id"`
	SampleID        int       `json:"sample_id"`
	TransactionType string    `json:"transaction_type"`
	Quantity        float64   `json:"quantity"`
	PerformedBy     string    `json:"performed_by"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
}
