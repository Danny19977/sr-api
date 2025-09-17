package models

import (
	"time"
)

type Manager struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UUID      string    `json:"uuid" gorm:"primaryKey"`

	Title       string  `json:"title"`
	CountryUUID string  `json:"country_uuid" gorm:"type:varchar(255);not null"`
	Country     Country `gorm:"foreignKey:CountryUUID;references:UUID"`
	UserUUID    string  `json:"user_uuid" gorm:"type:varchar(255);not null"`
	User        User    `gorm:"foreignKey:UserUUID;references:UUID"`
	Signature   string  `json:"signature"`
}
