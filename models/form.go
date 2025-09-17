package models

import "time"

type Form struct {
	UUID      string    `json:"uuid" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Title       string `json:"title" gorm:"type:varchar(255);not null"`
	Description string `json:"description" gorm:"type:text"`

	UserUUID     string    `json:"user_uuid" gorm:"type:varchar(255);not null"`
	User         *User     `json:"user,omitempty" gorm:"foreignKey:UserUUID;references:UUID"`
	CountryUUID  string    `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      *Country  `json:"country,omitempty" gorm:"foreignKey:CountryUUID;references:UUID"`
	ProvinceUUID string    `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     *Province `json:"province,omitempty" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	AreaUUID     string    `json:"area_uuid" gorm:"type:varchar(255)"`
	Area         *Area     `json:"area,omitempty" gorm:"foreignKey:AreaUUID;references:UUID"`

	FormItems []FormItem `json:"form_items,omitempty" gorm:"foreignKey:FormUUID;references:UUID"`

	Signature string `json:"signature" gorm:"type:text"`
}
