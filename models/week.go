package models

import "time"

type Week struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`

	Week     string `json:"week" gorm:"not null;unique"`
	Quantity string  `json:"quantity" gorm:"not null"`
	Role     string `json:"role" gorm:"type:varchar(255);not null"`

	CountryUUID  string `json:"country_uuid" gorm:"type:varchar(255)"`
	ProvinceUUID string `json:"province_uuid" gorm:"type:varchar(255)"`
	ProductUUID  string `json:"product_uuid" gorm:"type:varchar(255)"`
	MonthUUID    string `json:"month_uuid" gorm:"type:varchar(255)"`
	YearUUID     string `json:"year_uuid" gorm:"type:varchar(255)"`

	Signature string `json:"signature"`
}
