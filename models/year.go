package models

import "time"

type Year struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`

	Year string `json:"year" gorm:"not null;unique"`
	Quantity string  `json:"quantity" gorm:"not null"`

	Signature string `json:"signature"`  
}