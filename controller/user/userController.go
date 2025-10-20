package user

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/Danny19977/sr-api/utils"
	"github.com/gofiber/fiber/v2"
)

// Paginate
func GetPaginatedUsers(c *fiber.Ctx) error {
	db := database.DB

	// Parse query parameters for pagination
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page <= 0 {
		page = 1
	}
	limit, err := strconv.Atoi(c.Query("limit", "15"))
	if err != nil || limit <= 0 {
		limit = 15
	}
	offset := (page - 1) * limit

	// Parse search query
	search := c.Query("search", "")

	var users []models.User
	var totalRecords int64

	// Get user UUID from JWT
	userUUID, _ := utils.GetUserUUIDFromToken(c)
	var requestingUser models.User
	db.Preload("Country").Preload("Province").Where("uuid = ?", userUUID).First(&requestingUser)

	query := db.Model(&models.User{})
	if requestingUser.Role == "ASM" {
		query = query.Where("province_uuid = ?", requestingUser.ProvinceUUID)
	}
	query = query.Where("fullname ILIKE ? OR title ILIKE ?", "%"+search+"%", "%"+search+"%")
	query.Count(&totalRecords)

	// Use the same query for fetching users
	query = query.Preload("Country").Preload("Province").
		Offset(offset).
		Limit(limit).
		Order("users.updated_at DESC")
	err = query.Find(&users).Error
	// If ASM, filter users by province
	if requestingUser.Role == "ASM" {
		filtered := []models.User{}
		for _, u := range users {
			if u.ProvinceUUID != nil && requestingUser.ProvinceUUID != nil && *u.ProvinceUUID == *requestingUser.ProvinceUUID {
				filtered = append(filtered, u)
			}
		}
		users = filtered
	}

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch Users",
			"error":   err.Error(),
		})
	}

	// Calculate total pages
	totalPages := int((totalRecords + int64(limit) - 1) / int64(limit))

	//  Prepare pagination metadata
	pagination := map[string]interface{}{
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
		"page_size":     limit,
	}

	// Return response
	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Users retrieved successfully",
		"data":       users,
		"pagination": pagination,
	})
}

func GetPaginatedNoSerach(c *fiber.Ctx) error {
	db := database.DB

	// Parse query parameters for pagination
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page <= 0 {
		page = 1
	}
	limit, err := strconv.Atoi(c.Query("limit", "15"))
	if err != nil || limit <= 0 {
		limit = 15
	}
	offset := (page - 1) * limit
	var users []models.User
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.User{}).
		Count(&totalRecords)

	err = db.
		Preload("Country").Preload("Province").
		Offset(offset).
		Limit(limit).
		Order("users.updated_at DESC").
		Find(&users).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch Users",
			"error":   err.Error(),
		})
	}

	// Calculate total pages
	totalPages := int((totalRecords + int64(limit) - 1) / int64(limit))

	//  Prepare pagination metadata
	pagination := map[string]interface{}{
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
		"page_size":     limit,
	}

	// Return response
	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Users retrieved successfully",
		"data":       users,
		"pagination": pagination,
	})
}

// query all data
func GetAllUsers(c *fiber.Ctx) error {
	db := database.DB
	var users []models.User
	db.Preload("Country").Preload("Province").Find(&users)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All users",
		"data":    users,
	})
}

// Get one data
func GetUser(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var user models.User
	db.Preload("Country").Preload("Province").Where("uuid = ?", uuid).First(&user)
	if user.Fullname == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No User name found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "User found",
			"data":    user,
		},
	)
}

// Create data
func CreateUser(c *fiber.Ctx) error {
	type UserInput struct {
		FullName        string `json:"fullname"`
		Email           string `json:"email"`
		Phone           string `json:"Phone"`
		Title           string `json:"title"`
		Password        string `json:"password"`
		ConformPassword string `json:"confirm_password"`
		Role            string `json:"role"`
		Permission      string `json:"permission"`
		Image           string `json:"profile_image"`
		Status          bool   `json:"status"`
		CountryUUID     string `json:"country_uuid"`
		ProvinceUUID    string `json:"province_uuid"`
		AreaUUID        string `json:"area_uuid"`

		HeadUUID string `json:"head_uuid"`

		Signature string `json:"signature"`
	}

	var p UserInput

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	if p.FullName == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Form not complete",
				"data":    nil,
			},
		)
	}

	if p.Password != p.ConformPassword {
		c.Status(400)
		return c.JSON(fiber.Map{
			"message": "passwords do not match",
		})
	}

	user := &models.User{
		Fullname:     p.FullName,
		Email:        p.Email,
		Phone:        p.Phone,
		Role:         p.Role,
		Permission:   p.Permission,
		Status:       p.Status,
		CountryUUID:  stringToPointer(p.CountryUUID),
		ProvinceUUID: stringToPointer(p.ProvinceUUID),
		Signature:    p.Signature,
	}

	user.SetPassword(p.Password)

	if err := utils.ValidateStruct(*user); err != nil {
		c.Status(400)
		return c.JSON(err)
	}

	user.UUID = utils.GenerateUUID()

	user.Sync = true

	database.DB.Create(user)

	// Log user creation activity
	utils.LogCreateWithDB(database.DB, c, "user", user.Fullname, user.UUID)

	// }

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "User Created success",
			"data":    user,
		},
	)
}

// Helper function to convert string to *string (handles empty strings as nil)
func stringToPointer(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Update data
func UpdateUser(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateDataInput struct {
		FullName        string `json:"fullname"`
		Email           string `json:"email"`
		Phone           string `json:"Phone"`
		Title           string `json:"title"`
		Password        string `json:"password"`
		ConformPassword string `json:"confirm_password"`
		Role            string `json:"role"`
		Permission      string `json:"permission"`
		Image           string `json:"profile_image"`
		Status          bool   `json:"status"`
		CountryUUID     string `json:"country_uuid"`
		ProvinceUUID    string `json:"province_uuid"`
		AreaUUID        string `json:"area_uuid"`
		HeadUUID        string `json:"head_uuid"`
		Signature       string `json:"signature"`
	}

	var updateData UpdateDataInput

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	user := new(models.User)

	db.Where("uuid = ?", uuid).First(&user)
	user.Fullname = updateData.FullName
	user.Email = updateData.Email
	user.Phone = updateData.Phone
	user.Title = updateData.Title
	user.Role = updateData.Role
	user.Permission = updateData.Permission
	user.Status = updateData.Status
	user.CountryUUID = stringToPointer(updateData.CountryUUID)
	user.ProvinceUUID = stringToPointer(updateData.ProvinceUUID)
	user.Signature = updateData.Signature

	db.Save(&user)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "User updated success",
			"data":    user,
		},
	)
}

// Delete data
func DeleteUser(c *fiber.Ctx) error {
	uuid := c.Params("uuid")

	db := database.DB

	var User models.User
	db.Where("uuid = ?", uuid).First(&User)
	if User.Fullname == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No User name found",
				"data":    nil,
			},
		)
	}

	db.Delete(&User)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "User deleted success",
			"data":    nil,
		},
	)
}
