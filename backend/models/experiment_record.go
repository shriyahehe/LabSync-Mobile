package models

import "time"

type ExperimentRecord struct {
	ID           int       `json:"id"`
	ExperimentID int       `json:"experiment_id"`
	RecordedBy   string    `json:"recorded_by"`
	RecordType   string    `json:"record_type"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
}
