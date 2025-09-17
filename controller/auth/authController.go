package auth

import (
	"os"
	"strconv"

	"github.com/Danny19977/mypg-api/database"
	"github.com/Danny19977/mypg-api/models"
	"github.com/Danny19977/mypg-api/utils"
	"github.com/gofiber/fiber/v2"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func Register(c *fiber.Ctx) error {

	type RegisterInput struct {
		models.User
		PasswordConfirm string `json:"password_confirm"`
	}

	nu := new(RegisterInput)

	if err := c.BodyParser(&nu); err != nil {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	if nu.Password != nu.PasswordConfirm {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "passwords do not match",
		})
	}

	u := &models.User{
		Fullname:     nu.Fullname,
		Email:        nu.Email,
		Title:        nu.Title,
		Phone:        nu.Phone,
		Role:         nu.Role,
		Permission:   nu.Permission,
		Image:        nu.Image,
		Status:       nu.Status,
		Signature:    nu.Signature,
		CountryUUID:  nu.CountryUUID,
		ProvinceUUID: nu.ProvinceUUID,
		AreaUUID:     nu.AreaUUID,
	}

	u.SetPassword(nu.Password)

	if err := utils.ValidateStruct(*u); err != nil {
		c.Status(400)
		return c.JSON(err)
	}

	u.UUID = utils.GenerateUUID()

	database.DB.Create(u)

	// if err := database.DB.Create(u).Error; err != nil {
	// 	c.Status(500)
	// 	sm := strings.Split(err.Error(), ":")
	// 	m := strings.TrimSpace(sm[1])

	// 	return c.JSON(fiber.Map{
	// 		"message": m,
	// 	})
	// }

	return c.JSON(fiber.Map{
		"message": "user account created",
		"data":    u,
	})
}

func Login(c *fiber.Ctx) error {

	lu := new(models.Login)

	if err := c.BodyParser(&lu); err != nil {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	if err := utils.ValidateStruct(*lu); err != nil {
		c.Status(400)
		return c.JSON(err)
	}

	u := &models.User{}

	// Try to convert identifier to int for phone number search
	phoneNumber, err := strconv.Atoi(lu.Identifier)
	if err != nil {
		// If conversion fails, search only by email
		database.DB.Where("email = ?", lu.Identifier).First(&u)
	} else {
		// If conversion succeeds, search by both email and phone
		database.DB.Where("email = ? OR phone = ?", lu.Identifier, phoneNumber).First(&u)
	}

	if u.UUID == "" {
		// Log failed login attempt
		utils.LogErrorWithDB(database.DB, c, "login_failed", "Invalid email or phone", map[string]interface{}{
			"identifier": lu.Identifier,
			"ip_address": c.IP(),
			"user_agent": c.Get("User-Agent"),
		})

		c.Status(404)
		return c.JSON(fiber.Map{
			"message": "invalid email or phone 😰",
		})
	}

	if err := u.ComparePassword(lu.Password); err != nil {
		// Log failed login attempt
		utils.LogErrorWithDB(database.DB, c, "login_failed", "Incorrect password", map[string]interface{}{
			"user_uuid":  u.UUID,
			"identifier": lu.Identifier,
			"ip_address": c.IP(),
			"user_agent": c.Get("User-Agent"),
		})

		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "mot de passe incorrect! 😰",
		})
	}

	if !u.Status {
		// Log unauthorized access attempt
		utils.LogErrorWithDB(database.DB, c, "login_unauthorized", "User account is disabled", map[string]interface{}{
			"user_uuid":  u.UUID,
			"identifier": lu.Identifier,
			"ip_address": c.IP(),
			"user_agent": c.Get("User-Agent"),
		})

		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "vous n'êtes pas autorisé de se connecter 😰",
		})
	}

	token, err := utils.GenerateJwt(u.UUID)
	if err != nil {
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	// Log successful login
	utils.LogLoginWithDB(database.DB, c, u.UUID, map[string]interface{}{
		"fullname": u.Fullname,
		"email":    u.Email,
		"role":     u.Role,
		"title":    u.Title,
	})

	return c.JSON(fiber.Map{
		"message": "success",
		"data":    token,
	})

}

func AuthUser(c *fiber.Ctx) error {

	// Get user UUID from Authorization header token
	userUUID, err := utils.GetUserUUIDFromToken(c)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	u := models.User{}

	database.DB.
		// Joins("LEFT JOIN countries ON users.country_uuid = countries.uuid").
		// Joins("LEFT JOIN provinces ON users.province_uuid = provinces.uuid").
		// Joins("LEFT JOIN areas ON users.area_uuid = areas.uuid").
		// Joins("LEFT JOIN sub_areas ON users.sub_area_uuid = sub_areas.uuid").
		// Joins("LEFT JOIN communes ON users.commune_uuid = communes.uuid").
		Where("users.uuid = ?", userUUID).
		// 	Select(`
		// 		users.*,

		// 		countries.uuid as country_uuid,
		// 		countries.name as country_name,

		// 		provinces.uuid as province_uuid,
		// 		provinces.name as province_name,

		// 		areas.uuid as area_uuid,
		// 		areas.name as area_name,

		// 		sub_areas.uuid as subarea_uuid,
		// 		sub_areas.name as subarea_name,

		// 		communes.uuid as commune_uuid,
		// 		communes.name as commune_name
		// `).
		Preload("Country").
		Preload("Province").
		Preload("Area").
		First(&u)

	r := &models.UserResponse{
		UUID:         u.UUID,
		Fullname:     u.Fullname,
		Email:        u.Email,
		Title:        u.Title,
		Phone:        u.Phone,
		Role:         u.Role,
		Permission:   u.Permission,
		Status:       u.Status,
		CountryUUID:  u.CountryUUID,
		Country:      u.Country,
		ProvinceUUID: u.ProvinceUUID,
		Province:     u.Province,
		AreaUUID:     u.AreaUUID,
		Area:         u.Area,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,

		// CountryName:  u.Country.Name,
		// ProvinceName: u.Province.Name,
		// AreaName:     u.Area.Name,
		// SubAreaName:  u.SubArea.Name,
		// CommuneName:  u.Commune.Name,
		// Head:   u.Head,

	}
	return c.JSON(r)
}

func Logout(c *fiber.Ctx) error {
	// With token-based authentication, logout is handled client-side
	// The client should discard the token
	return c.JSON(fiber.Map{
		"message": "successfully logged out",
		"info":    "please discard your token on the client side",
	})
}

// User bioprofile
func UpdateInfo(c *fiber.Ctx) error {
	type UpdateDataInput struct {
		Fullname  string `json:"fullname"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Signature string `json:"signature"`
	}
	var updateData UpdateDataInput

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Review your input",
			"errors":  err.Error(),
		})
	}

	// Get user UUID from Authorization header token
	userUUID, err := utils.GetUserUUIDFromToken(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}

	user := new(models.User)

	db := database.DB

	db.Where("uuid = ?", userUUID).First(&user)
	user.Fullname = updateData.Fullname
	user.Email = updateData.Email
	user.Phone = updateData.Phone
	user.Signature = updateData.Signature

	db.Save(&user)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User successfully updated",
		"data":    user,
	})

}

func ChangePassword(c *fiber.Ctx) error {
	type UpdateDataInput struct {
		OldPassword     string `json:"old_password"`
		Password        string `json:"password"`
		PasswordConfirm string `json:"password_confirm"`
	}
	var updateData UpdateDataInput

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Review your input",
			"errors":  err.Error(),
		})
	}

	// Get user UUID from Authorization header token
	userUUID, err := utils.GetUserUUIDFromToken(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  "error",
			"message": err.Error(),
		})
	}

	user := new(models.User)

	database.DB.Where("uuid = ?", userUUID).First(&user)

	if err := user.ComparePassword(updateData.OldPassword); err != nil {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "votre mot de passe n'est pas correct! 😰",
		})
	}

	if updateData.Password != updateData.PasswordConfirm {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "passwords do not match",
		})
	}

	p, err := utils.HashPassword(updateData.Password)
	if err != nil {
		return err
	}

	db := database.DB

	db.First(&user, user.UUID)
	user.Password = p

	db.Save(&user)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Password successfully updated",
		"data":    user,
	})

}
