package models

import "time"

type Material struct {
	ID              int        `json:"id"`
	LaboratoryID    int        `json:"laboratory_id"`
	Name            string     `json:"name"`
	Category        string     `json:"category"`
	Quantity        float64    `json:"quantity"`
	Unit            string     `json:"unit"`
	MinimumQuantity float64    `json:"minimum_quantity"`
	ExpiryDate      *time.Time `json:"expiry_date,omitempty"`
}
