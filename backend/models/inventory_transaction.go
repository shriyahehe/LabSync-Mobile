package models

import "time"

type InventoryTransaction struct {
	ID              int       `json:"id"`
	MaterialID      int       `json:"material_id"`
	TransactionType string    `json:"transaction_type"`
	Quantity        float64   `json:"quantity"`
	PerformedBy     string    `json:"performed_by"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
}
