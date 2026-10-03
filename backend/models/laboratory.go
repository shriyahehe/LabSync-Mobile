package models

type Laboratory struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	Department string `json:"department"`
	Location   string `json:"location"`
}
