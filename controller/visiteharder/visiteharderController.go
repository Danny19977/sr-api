package visiteharder

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Get paginated form submissions
func GetPaginatedVisiteHarders(c *fiber.Ctx) error {
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

	var dataList []models.VisiteHarder
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.VisiteHarder{}).
		Where("submitter_name ILIKE ? OR submitter_email ILIKE ? OR status ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%").
		Count(&totalRecords)

	// Fetch paginated data
	err = db.
		Preload("Form").Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("VisiteData").
		Where("submitter_name ILIKE ? OR submitter_email ILIKE ? OR status ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%").
		Offset(offset).
		Limit(limit).
		Order("updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form submissions",
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
		"message":    "Form submissions retrieved successfully",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get all form submissions
func GetAllVisiteHarders(c *fiber.Ctx) error {
	db := database.DB
	var data []models.VisiteHarder
	db.Preload("Form").Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("VisiteData").Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Form Submissions",
		"data":    data,
	})
}

// Get one form submission by UUID
func GetVisiteHarder(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var visiteHarder models.VisiteHarder
	db.Preload("Form").Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("VisiteData.FormItem").Where("uuid = ?", uuid).First(&visiteHarder)
	if visiteHarder.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form submission found",
				"data":    nil,
			},
		)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form submission found",
		"data":    visiteHarder,
	})
}

// Create a form submission
func CreateVisiteHarder(c *fiber.Ctx) error {
	p := &models.VisiteHarder{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form submission created successfully",
			"data":    p,
		},
	)
}

// Update a form submission
func UpdateVisiteHarder(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var updateData models.VisiteHarder

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	var visiteHarder models.VisiteHarder
	db.Where("uuid = ?", uuidParam).First(&visiteHarder)
	if visiteHarder.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form submission found",
				"data":    nil,
			},
		)
	}

	// Update fields
	visiteHarder.SubmitterName = updateData.SubmitterName
	visiteHarder.SubmitterEmail = updateData.SubmitterEmail
	visiteHarder.FormUUID = updateData.FormUUID
	visiteHarder.UserUUID = updateData.UserUUID
	visiteHarder.CountryUUID = updateData.CountryUUID
	visiteHarder.ProvinceUUID = updateData.ProvinceUUID
	visiteHarder.AreaUUID = updateData.AreaUUID
	visiteHarder.Signature = updateData.Signature
	visiteHarder.Status = updateData.Status

	db.Save(&visiteHarder)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form submission updated successfully",
			"data":    visiteHarder,
		},
	)
}

// Delete a form submission
func DeleteVisiteHarder(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var visiteHarder models.VisiteHarder
	// First check if the form submission exists
	result := db.Where("uuid = ?", uuidParam).First(&visiteHarder)
	if result.Error != nil {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form submission found",
				"data":    nil,
			},
		)
	}

	// Permanently delete from database
	deleteResult := db.Unscoped().Delete(&visiteHarder)
	if deleteResult.Error != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Failed to delete form submission",
				"error":   deleteResult.Error.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form submission deleted successfully",
			"data":    nil,
		},
	)
}

// Get form submissions by form UUID
func GetVisiteHardersByForm(c *fiber.Ctx) error {
	formUUID := c.Params("formUuid")
	db := database.DB
	var submissions []models.VisiteHarder

	err := db.Preload("Form").Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("VisiteData.FormItem").
		Where("form_uuid = ?", formUUID).
		Order("updated_at DESC").
		Find(&submissions).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form submissions",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form submissions retrieved successfully",
		"data":    submissions,
	})
}

// Get form submissions by user UUID
func GetVisiteHardersByUser(c *fiber.Ctx) error {
	userUUID := c.Params("userUuid")
	db := database.DB
	var submissions []models.VisiteHarder

	err := db.Preload("Form").Preload("User").Preload("Country").Preload("Province").Preload("Area").Preload("VisiteData.FormItem").
		Where("user_uuid = ?", userUUID).
		Order("updated_at DESC").
		Find(&submissions).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch user submissions",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User submissions retrieved successfully",
		"data":    submissions,
	})
}
