package form

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Get paginated forms
func GetPaginatedForms(c *fiber.Ctx) error {
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

	var dataList []models.Form
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.Form{}).
		Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%").
		Count(&totalRecords)

	// Fetch paginated data
	err = db.
		Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("FormItems").
		Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%").
		Offset(offset).
		Limit(limit).
		Order("updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch forms",
			"error":   err.Error(),
		})
	}

	// Calculate total pages
	totalPages := int((totalRecords + int64(limit) - 1) / int64(limit))

	// Prepare pagination metadata
	pagination := map[string]interface{}{
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
		"page_size":     limit,
	}

	// Return response
	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Forms retrieved successfully",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get all forms
func GetAllForms(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Form
	db.Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("FormItems").Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Forms",
		"data":    data,
	})
}

// Get one form by UUID
func GetForm(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var form models.Form
	db.Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("FormItems").Where("uuid = ?", uuid).First(&form)
	if form.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form found",
				"data":    nil,
			},
		)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form found",
		"data":    form,
	})
}

// Create a form
func CreateForm(c *fiber.Ctx) error {
	p := &models.Form{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form created successfully",
			"data":    p,
		},
	)
}

// Update a form
func UpdateForm(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var updateData models.Form

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	var form models.Form
	db.Where("uuid = ?", uuidParam).First(&form)
	if form.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form found",
				"data":    nil,
			},
		)
	}

	// Update fields
	form.Title = updateData.Title
	form.Description = updateData.Description
	form.UserUUID = updateData.UserUUID
	form.CountryUUID = updateData.CountryUUID
	form.ProvinceUUID = updateData.ProvinceUUID
	form.AreaUUID = updateData.AreaUUID
	form.Signature = updateData.Signature

	db.Save(&form)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form updated successfully",
			"data":    form,
		},
	)
}

// Delete a form
func DeleteForm(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var form models.Form
	// First check if the form exists
	result := db.Where("uuid = ?", uuidParam).First(&form)
	if result.Error != nil {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form found",
				"data":    nil,
			},
		)
	}

	// Permanently delete from database
	deleteResult := db.Unscoped().Delete(&form)
	if deleteResult.Error != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Failed to delete form",
				"error":   deleteResult.Error.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form deleted successfully",
			"data":    nil,
		},
	)
}

// Get forms by user
func GetFormsByUser(c *fiber.Ctx) error {
	userUUID := c.Params("userUuid")
	db := database.DB
	var forms []models.Form

	err := db.Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("FormItems").
		Where("user_uuid = ?", userUUID).
		Order("updated_at DESC").
		Find(&forms).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch user forms",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User forms retrieved successfully",
		"data":    forms,
	})
}
