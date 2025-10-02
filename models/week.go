package models

import "time"

type Week struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`

	Week     string `json:"week" gorm:"not null"`
	Quantity string `json:"quantity" gorm:"not null"`
	Role     string `json:"role" gorm:"type:varchar(255);not null"`

	CountryUUID  string   `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      Country  `json:"country" gorm:"foreignKey:CountryUUID;references:UUID"`
	ProvinceUUID string   `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     Province `json:"province" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	ProductUUID  string   `json:"product_uuid" gorm:"type:varchar(255)"`
	MonthUUID    string   `json:"month_uuid" gorm:"type:varchar(255)"`
	YearUUID     string   `json:"year_uuid" gorm:"type:varchar(255)"`

	Signature string `json:"signature"`
}
