package models

import (
	"time"
)

// Visite represents predefined options/choices for form items (like dropdown options, radio button choices, etc.)
type Visite struct {
	UUID      string    `json:"uuid" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Option details
	DisplayText string `json:"display_text" gorm:"type:varchar(255);not null"`
	Value       string `json:"value" gorm:"type:varchar(255);not null"` // The actual value stored
	SortOrder   int    `json:"sort_order" gorm:"default:0"`
	OptionLabel string `json:"option_label" gorm:"type:varchar(255)"` // Additional label/description
	IsDefault   bool   `json:"is_default" gorm:"default:false"`       // Whether this is the default selection

	// Form item relationship
	FormItemUUID string    `json:"form_item_uuid" gorm:"type:varchar(255);not null"`
	FormItem     *FormItem `json:"form_item,omitempty" gorm:"foreignKey:FormItemUUID;references:UUID"`

	// Creator info
	UserUUID string `json:"user_uuid" gorm:"type:varchar(255)"`
	User     *User  `json:"user,omitempty" gorm:"foreignKey:UserUUID;references:UUID"`

	// Location context (if options are location-specific)
	AreaUUID     string    `json:"area_uuid" gorm:"type:varchar(255)"`
	Area         *Area     `json:"area,omitempty" gorm:"foreignKey:AreaUUID;references:UUID"`
	ProvinceUUID string    `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     *Province `json:"province,omitempty" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	CountryUUID  string    `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      *Country  `json:"country,omitempty" gorm:"foreignKey:CountryUUID;references:UUID"`

	Signature string `json:"signature" gorm:"type:text"`
}
