package models

import (
	"time"
)

type Province struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID string `gorm:"primaryKey;not null;unique" json:"uuid"`

	Name        string  `json:"name" gorm:"unique;not null"`
	CountryUUID string  `json:"country_uuid" gorm:"type:varchar(255);not null"`
	Country     Country `gorm:"foreignKey:CountryUUID;references:UUID"`

	Signature string `json:"signature_uid"`

	Users   []User   `gorm:"foreignKey:ProvinceUUID;references:UUID"`
}
