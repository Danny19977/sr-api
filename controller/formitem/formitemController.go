package formitem

import (
	"strconv"

	"github.com/Danny19977/mypg-api/database"
	"github.com/Danny19977/mypg-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Get paginated form items
func GetPaginatedFormItems(c *fiber.Ctx) error {
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

	var dataList []models.FormItem
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.FormItem{}).
		Where("question ILIKE ? OR item_type ILIKE ?", "%"+search+"%", "%"+search+"%").
		Count(&totalRecords)

	// Fetch paginated data
	err = db.
		Preload("Form").
		Where("question ILIKE ? OR item_type ILIKE ?", "%"+search+"%", "%"+search+"%").
		Offset(offset).
		Limit(limit).
		Order("sort_order ASC, updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form items",
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
		"message":    "Form items retrieved successfully",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get all form items
func GetAllFormItems(c *fiber.Ctx) error {
	db := database.DB
	var data []models.FormItem
	db.Preload("Form").Order("sort_order ASC").Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Form Items",
		"data":    data,
	})
}

// Get one form item by UUID
func GetFormItem(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var formItem models.FormItem
	db.Preload("Form").Where("uuid = ?", uuid).First(&formItem)
	if formItem.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form item found",
				"data":    nil,
			},
		)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form item found",
		"data":    formItem,
	})
}

// Create a form item
func CreateFormItem(c *fiber.Ctx) error {
	p := &models.FormItem{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form item created successfully",
			"data":    p,
		},
	)
}

// Update a form item
func UpdateFormItem(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var updateData models.FormItem

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	var formItem models.FormItem
	db.Where("uuid = ?", uuidParam).First(&formItem)
	if formItem.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form item found",
				"data":    nil,
			},
		)
	}

	// Update fields
	formItem.Question = updateData.Question
	formItem.ItemType = updateData.ItemType
	formItem.Required = updateData.Required
	formItem.SortOrder = updateData.SortOrder
	formItem.Options = updateData.Options
	formItem.FormUUID = updateData.FormUUID

	db.Save(&formItem)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form item updated successfully",
			"data":    formItem,
		},
	)
}

// Delete a form item
func DeleteFormItem(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var formItem models.FormItem
	// First check if the form item exists
	result := db.Where("uuid = ?", uuidParam).First(&formItem)
	if result.Error != nil {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form item found",
				"data":    nil,
			},
		)
	}

	// Permanently delete from database
	deleteResult := db.Unscoped().Delete(&formItem)
	if deleteResult.Error != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Failed to delete form item",
				"error":   deleteResult.Error.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form item deleted successfully",
			"data":    nil,
		},
	)
}

// Get form items by form UUID
func GetFormItemsByForm(c *fiber.Ctx) error {
	formUUID := c.Params("formUuid")
	db := database.DB
	var formItems []models.FormItem

	err := db.Preload("Form").
		Where("form_uuid = ?", formUUID).
		Order("sort_order ASC").
		Find(&formItems).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form items",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form items retrieved successfully",
		"data":    formItems,
	})
}
