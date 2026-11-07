package models

import "time"

type Equipment struct {
	ID           int       `json:"id"`
	LaboratoryID int       `json:"laboratory_id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	SerialNumber string    `json:"serial_number"`
	Status       string    `json:"status"`
	Location     string    `json:"location"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"created_at"`
}
