package models

import "time"

type Year struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`

	Year int64 `json:"year" gorm:"not null;unique"`
	Quantity int64  `json:"quantity" gorm:"not null"`
	Role string `json:"role" gorm:"type:varchar(255);not null"`

	Signature string `json:"signature"`  
}