package models

import "time"

type EquipmentTransaction struct {
	ID              int        `json:"id"`
	EquipmentID     int        `json:"equipment_id"`
	TransactionType string     `json:"transaction_type"`
	PerformedBy     string     `json:"performed_by"`
	Notes           string     `json:"notes"`
	CheckoutTime    *time.Time `json:"checkout_time,omitempty"`
	ReturnTime      *time.Time `json:"return_time,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}
