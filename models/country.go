package models

import (
	"time"
)

type Country struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID string `gorm:"primaryKey;type:text;not null;unique" json:"uuid"`

	Name      string `json:"name"`
	Signature string `json:"signature"`

	// Use slices, not pointer to slices, for GORM relations
	Users     []User     `gorm:"foreignKey:CountryUUID;references:UUID"`
	Provinces []Province `gorm:"foreignKey:CountryUUID;references:UUID"`
	Areas     []Area     `gorm:"foreignKey:CountryUUID;references:UUID"`
	Visites   []Visite   `gorm:"foreignKey:CountryUUID;references:UUID"`
}
