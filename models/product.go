package models

import "time"

type Product struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`
	Name      string    `json:"name" gorm:"not null"`
	Signature string    `json:"signature"`

	// Relationships
	Sales []Sale `json:"sales" gorm:"foreignKey:ProductUUID;references:UUID"`
}
