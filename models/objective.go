package models

import "time"

type Objective struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt time.Time `json:"deleted_at"`

	CountryUUID  string `json:"country_uuid" gorm:"type:varchar(255)"`
	ProvinceUUID string `json:"province_uuid" gorm:"type:varchar(255)"`
	UserUUID     string `json:"user_uuid" gorm:"type:varchar(255)"`

	UUID  string `json:"uuid" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Month int64 `json:"month"`
	Week1 int64 `json:"week"`
}
