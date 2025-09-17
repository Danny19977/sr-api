package visite

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Get paginated visites
func GetPaginatedVisites(c *fiber.Ctx) error {
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

	var dataList []models.Visite
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.Visite{}).
		Where("display_text ILIKE ? OR value ILIKE ? OR option_label ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%").
		Count(&totalRecords)

	// Fetch paginated data
	err = db.
		Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("display_text ILIKE ? OR value ILIKE ? OR option_label ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%").
		Offset(offset).
		Limit(limit).
		Order("sort_order ASC, updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form options",
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
		"message":    "Form options retrieved successfully",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get all visites
func GetAllVisites(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Visite
	db.Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").Order("sort_order ASC").Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Form Options",
		"data":    data,
	})
}

// Get one visite by UUID
func GetVisite(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var visite models.Visite
	db.Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").Where("uuid = ?", uuid).First(&visite)
	if visite.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form option found",
				"data":    nil,
			},
		)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form option found",
		"data":    visite,
	})
}

// Create a visite
func CreateVisite(c *fiber.Ctx) error {
	p := &models.Visite{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form option created successfully",
			"data":    p,
		},
	)
}

// Update a visite
func UpdateVisite(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var updateData models.Visite

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	var visite models.Visite
	db.Where("uuid = ?", uuidParam).First(&visite)
	if visite.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form option found",
				"data":    nil,
			},
		)
	}

	// Update fields
	visite.DisplayText = updateData.DisplayText
	visite.Value = updateData.Value
	visite.SortOrder = updateData.SortOrder
	visite.OptionLabel = updateData.OptionLabel
	visite.IsDefault = updateData.IsDefault
	visite.FormItemUUID = updateData.FormItemUUID
	visite.UserUUID = updateData.UserUUID
	visite.AreaUUID = updateData.AreaUUID
	visite.ProvinceUUID = updateData.ProvinceUUID
	visite.CountryUUID = updateData.CountryUUID
	visite.Signature = updateData.Signature

	db.Save(&visite)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form option updated successfully",
			"data":    visite,
		},
	)
}

// Delete a visite
func DeleteVisite(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var visite models.Visite
	// First check if the visite exists
	result := db.Where("uuid = ?", uuidParam).First(&visite)
	if result.Error != nil {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form option found",
				"data":    nil,
			},
		)
	}

	// Permanently delete from database
	deleteResult := db.Unscoped().Delete(&visite)
	if deleteResult.Error != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Failed to delete form option",
				"error":   deleteResult.Error.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form option deleted successfully",
			"data":    nil,
		},
	)
}

// Get form options by form item UUID
func GetVisitesByFormItem(c *fiber.Ctx) error {
	formItemUUID := c.Params("formItemUuid")
	db := database.DB
	var options []models.Visite

	err := db.Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("form_item_uuid = ?", formItemUUID).
		Order("sort_order ASC").
		Find(&options).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form options",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form options retrieved successfully",
		"data":    options,
	})
}
