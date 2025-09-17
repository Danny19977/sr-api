package models

import (
	"time"
)

type Notification struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID string `gorm:"primaryKey;not null;unique" json:"uuid"`
}
