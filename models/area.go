package models

import (
	"time"
)

type Area struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID string `gorm:"primaryKey;not null;unique" json:"uuid"`

	Name         string   `json:"name" gorm:"unique;not null"`
	CountryUUID  string   `json:"country_uuid" gorm:"type:varchar(255);not null"`
	Country      Country  `gorm:"foreignKey:CountryUUID;references:UUID"`
	ProvinceUUID string   `json:"province_uuid" gorm:"type:varchar(255);not null"`
	Province     Province `gorm:"foreignKey:ProvinceUUID;references:UUID"`

	Signature string `json:"signature_uid"`

	// Add all missing relationships
	Users   []User   `gorm:"foreignKey:AreaUUID;references:UUID"`
	Visites []Visite `gorm:"foreignKey:AreaUUID;references:UUID"`
}
