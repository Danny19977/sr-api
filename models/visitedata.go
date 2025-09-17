package models

import (
	"fmt"
	"time"
)

// VisiteData represents individual form field responses (like answers to specific questions)
type VisiteData struct {
	UUID      string    `json:"uuid" gorm:"primaryKey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeleteAt  time.Time `json:"deleted_at" gorm:"index"`

	TextValue    string   `json:"text_value" gorm:"type:text"`            // For text responses
	RadioValue   string   `json:"radio_value" gorm:"type:varchar(255)"`   // For single choice responses
	Checkbox     string   `json:"checkbox_value" gorm:"type:text"`        // For multiple choice responses (stored as JSON array)
	Email        string   `json:"email_value" gorm:"type:varchar(255)"`   // For email responses
	NumberValue  *float64 `json:"number_value" gorm:"type:decimal(10,2)"` // For numeric responses
	BooleanValue *string  `json:"boolean_value"`                          // For boolean responses
	Comment      string   `json:"comment" gorm:"type:text"`
	FileURL      string   `json:"file_url" gorm:"type:varchar(500)"` // For file uploads

	// GPS coordinates (if applicable) - using decimal for better precision
	Latitude  *float64 `json:"latitude" `
	Longitude *float64 `json:"longitude"`

	// Entry differentiation for multiple entries of same form item
	EntryOrder    int    `json:"entry_order" gorm:"default:1"`             // Order/sequence number for multiple entries
	EntryLabel    string `json:"entry_label" gorm:"type:varchar(255)"`     // Custom label for entry (e.g., "Morning Reading", "Evening Reading")
	SubItemID     string `json:"sub_item_id" gorm:"type:varchar(255)"`     // For grouping related sub-items
	ParentEntryID string `json:"parent_entry_id" gorm:"type:varchar(255)"` // For hierarchical entries

	// Relationships
	VisiteHarderUUID string        `json:"visite_harder_uuid" gorm:"type:varchar(255);not null"`
	VisiteHarder     *VisiteHarder `json:"visite_harder,omitempty" gorm:"foreignKey:VisiteHarderUUID;references:UUID"`

	FormItemUUID string    `json:"form_item_uuid" gorm:"type:varchar(255);not null"`
	FormItem     *FormItem `json:"form_item,omitempty" gorm:"foreignKey:FormItemUUID;references:UUID"`

	// User info (copied from submission for easier querying)
	UserUUID string `json:"user_uuid" gorm:"type:varchar(255)"`
	User     *User  `json:"user,omitempty" gorm:"foreignKey:UserUUID;references:UUID"`

	// Location info (copied from submission for easier querying)
	AreaUUID     string    `json:"area_uuid" gorm:"type:varchar(255)"`
	Area         *Area     `json:"area,omitempty" gorm:"foreignKey:AreaUUID;references:UUID"`
	ProvinceUUID string    `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     *Province `json:"province,omitempty" gorm:"foreignKey:ProvinceUUID;references:UUID"`
	CountryUUID  string    `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      *Country  `json:"country,omitempty" gorm:"foreignKey:CountryUUID;references:UUID"`

	Signature string `json:"signature" gorm:"type:text"`
}

// Helper methods for GPS coordinates
func (vd *VisiteData) SetLatitude(lat float64) {
	vd.Latitude = &lat
}

func (vd *VisiteData) SetLongitude(lng float64) {
	vd.Longitude = &lng
}

func (vd *VisiteData) GetLatitude() float64 {
	if vd.Latitude != nil {
		return *vd.Latitude
	}
	return 0.0
}

func (vd *VisiteData) GetLongitude() float64 {
	if vd.Longitude != nil {
		return *vd.Longitude
	}
	return 0.0
}

func (vd *VisiteData) HasGPSCoordinates() bool {
	return vd.Latitude != nil && vd.Longitude != nil
}

// Helper methods for multiple entries
func (vd *VisiteData) SetEntryOrder(order int) {
	vd.EntryOrder = order
}

func (vd *VisiteData) SetEntryLabel(label string) {
	vd.EntryLabel = label
}

func (vd *VisiteData) IsFirstEntry() bool {
	return vd.EntryOrder == 1
}

// Generate a unique identifier for this specific entry
func (vd *VisiteData) GetEntryIdentifier() string {
	if vd.EntryLabel != "" {
		return vd.EntryLabel
	}
	return fmt.Sprintf("Entry %d", vd.EntryOrder)
}
