package models

import "time"

type FormItem struct {
	UUID      string    `json:"uuid" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Question  string `json:"question" gorm:"type:varchar(500);not null"`
	ItemType  string `json:"item_type" gorm:"type:varchar(50);not null"` // text, textarea, select, radio, checkbox, file, etc.
	Required  bool   `json:"required" gorm:"default:false"`
	SortOrder int    `json:"sort_order" gorm:"default:0"`
	Options   string `json:"options" gorm:"type:text"` // JSON string for select/radio/checkbox options

	FormUUID string `json:"form_uuid" gorm:"type:varchar(255);not null"`
	Form     *Form  `json:"form,omitempty" gorm:"foreignKey:FormUUID;references:UUID"`

	// Remove FieldUUID and Value as they don't belong in form definition
	// FieldUUID string `json:"field_uuid"`
	// Value     string `json:"value"`
}
