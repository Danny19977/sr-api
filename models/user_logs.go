package models

import (
	"time"
)

type UserLogs struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID string `json:"uuid" gorm:"primaryKey;type:varchar(255);not null;unique"`

	Name        string `json:"name"`
	Action      string `json:"action"`
	Description string `json:"Description"`
	UserUUID    string `json:"user_uuid" gorm:"type:varchar(255);not null"`
	User        User   `json:"user" gorm:"foreignKey:UserUUID;references:UUID"`
	Signature   string `json:"Signature"`
}
