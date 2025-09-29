
package year

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Paginate Years
func GetPaginatedYear(c *fiber.Ctx) error {
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

	var dataList []models.Year
	var totalRecords int64

	db.Model(&models.Year{}).
		Where("year ILIKE ?", "%"+search+"%").
		Count(&totalRecords)

	err = db.Where("year ILIKE ?", "%"+search+"%").Offset(offset).Limit(limit).Order("updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch years",
			"error":   err.Error(),
		})
	}

	totalPages := int((totalRecords + int64(limit) - 1) / int64(limit))
	pagination := map[string]interface{}{
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
		"page_size":     limit,
	}

	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Get all Years Paginate success",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get All Years
func GetAllYears(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Year
	db.Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All years support",
		"data":    data,
	})
}

// Get one Year by UUID
func GetYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var year models.Year
	db.Where("uuid = ?", uuid).First(&year)
	if year.Year == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Year found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Year found",
			"data":    year,
		},
	)
}

// Get one Year by year string
func GetYearByYearString(c *fiber.Ctx) error {
	yearStr := c.Params("year")
	db := database.DB
	var year models.Year
	db.Where("year = ?", yearStr).First(&year)
	if year.Year == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Year found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Year found",
			"data":    year,
		},
	)
}

// Create Year
func CreateYear(c *fiber.Ctx) error {
	p := &models.Year{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Year created success",
			"data":    p,
		},
	)
}

// Update Year
func UpdateYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateData struct {
		UUID      string `json:"uuid"`
		Year      string `json:"year"`
		Quantity  string `json:"quantity"`
		Signature string `json:"signature"`
	}

	var updateData UpdateData

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	year := new(models.Year)
	db.Where("uuid = ?", uuid).First(&year)
	year.Year = updateData.Year
	year.Quantity = updateData.Quantity
	year.Signature = updateData.Signature
	db.Save(&year)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Year updated success",
			"data":    year,
		},
	)
}

// Delete Year
func DeleteYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	var year models.Year
	db.Where("uuid = ?", uuid).First(&year)
	if year.Year == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Year found",
				"data":    nil,
			},
		)
	}
	db.Delete(&year)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Year deleted success",
			"data":    nil,
		},
	)
}
