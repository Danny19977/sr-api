package models

import "time"

type Sale struct {
	UUID         string    `json:"uuid" gorm:"primaryKey;unique;not null"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    time.Time `json:"deleted_at" gorm:"autoDeleteTime"`
	ProvinceUUID string    `json:"province_uuid" gorm:"not null"`
	ProductUUID  string    `json:"product_uuid" gorm:"not null"`
	UserUUID     string    `json:"user_uuid" gorm:"not null"`
	Quantity     int64     `json:"quantity" gorm:"not null"`
}
