package models

import "time"

// VisiteHarder represents a form submission/response (like a Google Form response)
type VisiteHarder struct {
	UUID      string    `json:"uuid" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Basic submission info
	SubmitterName  string `json:"submitter_name" gorm:"type:varchar(255)"`
	SubmitterEmail string `json:"submitter_email" gorm:"type:varchar(255)"`

	// Form reference
	FormUUID string `json:"form_uuid" gorm:"type:varchar(255);not null"`
	Form     *Form  `json:"form,omitempty" gorm:"foreignKey:FormUUID;references:UUID"`

	// User who submitted (if authenticated)
	UserUUID string `json:"user_uuid" gorm:"type:varchar(255)"`
	User     *User  `json:"user,omitempty" gorm:"foreignKey:UserUUID;references:UUID"`

	// Location info
	CountryUUID  string    `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      *Country  `json:"country,omitempty" gorm:"foreignKey:CountryUUID;references:UUID"`
	ProvinceUUID string    `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     *Province `json:"province,omitempty" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	AreaUUID     string    `json:"area_uuid" gorm:"type:varchar(255)"`
	Area         *Area     `json:"area,omitempty" gorm:"foreignKey:AreaUUID;references:UUID"`

	// Submission data
	VisiteData []VisiteData `json:"visite_data,omitempty" gorm:"foreignKey:VisiteHarderUUID;references:UUID"`

	Signature string `json:"signature" gorm:"type:text"`
	Status    string `json:"status" gorm:"type:varchar(50);default:'submitted'"` // submitted, reviewed, approved, etc.
}
