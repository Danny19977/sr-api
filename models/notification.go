package models

import (
	"time"
)

type Notification struct {
	UUID      string    `gorm:"primaryKey;not null;unique" json:"uuid"`
	Name      string    `json:"name" gorm:"unique;not null"`
	Message   string    `json:"message" gorm:"not null"`
	Type      string    `json:"type" gorm:"not null"`           // e.g., "info", "warning", "error"
	Status    string    `json:"status" gorm:"default:'unread'"` // e.g., "read", "unread"
	UserUUID  string    `json:"user_uuid" gorm:"not null"`      // UUID of the recipient
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt time.Time `json:"deleted_at" gorm:"index"`
}
