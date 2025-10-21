package models

import "time"

type Sale struct {
	UUID      string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt time.Time `json:"deleted_at" gorm:"autoDeleteTime"`

	ProvinceUUID string `json:"province_uuid" gorm:"not null"`
	ProductUUID  string `json:"product_uuid" gorm:"not null"`
	YearUUID     string `json:"year_uuid"`
	MonthUUID    string `json:"month_uuid"`
	WeekUUID     string `json:"week_uuid"`

	UserUUID  string `json:"user_uuid" gorm:"not null"`
	Quantity  int64  `json:"quantity" gorm:"not null"`
	Signature string `json:"signature"`

	// Relationships
	Province *Province `json:"province" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	Product  *Product  `json:"product" gorm:"foreignKey:ProductUUID;references:UUID"`
	User     *User     `json:"user" gorm:"foreignKey:UserUUID;references:UUID"`
	Year     *Year     `json:"year" gorm:"foreignKey:YearUUID;references:UUID"`
	Month    *Month    `json:"month" gorm:"foreignKey:MonthUUID;references:UUID"`
	Week     *Week     `json:"week" gorm:"foreignKey:WeekUUID;references:UUID"`
}
