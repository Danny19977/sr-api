package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	UUID            string    `gorm:"primaryKey;not null;unique" json:"uuid"`
	Sync            bool      `json:"sync" gorm:"default:false"`
	Fullname        string    `json:"fullname"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	Title           string    `json:"title"`
	Password        string    `json:"password"`
	ConformPassword string    `json:"confirm_password"`
	Role            string    `json:"role"`
	Permission      string    `json:"permission"`
	Image           string    `json:"profile_image"`
	Status          bool      `json:"status"`
	CountryUUID     *string   `json:"country_uuid" gorm:"type:varchar(255)"`
	Country         *Country  `gorm:"foreignKey:CountryUUID;references:UUID"`
	ProvinceUUID    *string   `json:"province_uuid" gorm:"type:varchar(255)"`
	Province        *Province `gorm:"foreignKey:ProvinceUUID;references:UUID"`
	AreaUUID        *string   `json:"area_uuid" gorm:"type:varchar(255)"`
	Area            *Area     `gorm:"foreignKey:AreaUUID;references:UUID"`

	Signature string `json:"signature"`

	// Add relationship for Deli without circular reference to UserLogs
	// Deli []Deli `gorm:"foreignKey:UserUUID;references:UUID"`
}

type UserResponse struct {
	UUID         string  `json:"uuid"`
	Fullname     string  `json:"fullname"`
	Email        string  `json:"email"`
	Phone        string  `json:"phone"`
	Title        string  `json:"title"`
	Role         string  `json:"role"`
	CountryUUID  *string `json:"country_uuid" gorm:"type:varchar(255)"`
	Country      *Country
	ProvinceUUID *string `json:"province_uuid" gorm:"type:varchar(255)"`
	Province     *Province
	AreaUUID     *string `json:"area_uuid" gorm:"type:varchar(255)"`
	Area         *Area
	Permission   string `json:"permission"`
	Status       bool   `json:"status"`
	Signature    string `json:"signature"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type UserPaginate struct {
	UUID       string    `json:"uuid"`
	Fullname   string    `json:"fullname"`
	Email      string    `json:"email"`
	Phone      string    `json:"phone"`
	Title      string    `json:"title"`
	Role       string    `json:"role"`
	Area       string    `json:"area"`
	Province   string    `json:"province"`
	Sup        string    `json:"sup"`
	Permission string    `json:"permission"`
	Status     bool      `json:"status"`
	Signature  string    `json:"signature"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Login struct {
	Identifier string `json:"identifier" validate:"required"`
	// Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (u *User) SetPassword(p string) {
	hp, _ := bcrypt.GenerateFromPassword([]byte(p), 14)
	u.Password = string(hp)
}

func (u *User) ComparePassword(p string) error {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(p))
	return err
}

func (u *User) Count(db *gorm.DB) int64 {
	var total int64
	db.Model(&User{}).Count(&total)
	return total
}

func (u *User) Paginate(db *gorm.DB, limit int, offset int) interface{} {
	su := []User{}
	db.Preload("Province").Offset(offset).Limit(limit).Find(&su)
	return su
}
