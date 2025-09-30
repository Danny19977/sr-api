package week

import (
	"fmt"
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Paginate Weeks
func GetPaginatedWeek(c *fiber.Ctx) error {
	db := database.DB

	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page <= 0 {
		page = 1
	}
	limit, err := strconv.Atoi(c.Query("limit", "15"))
	if err != nil || limit <= 0 {
		limit = 15
	}
	offset := (page - 1) * limit

	search := c.Query("search", "")

	var dataList []models.Week
	var totalRecords int64

	db.Model(&models.Week{}).
		Where("week ILIKE ?", "%"+search+"%").
		Count(&totalRecords)

	err = db.Where("week ILIKE ?", "%"+search+"%").Offset(offset).Limit(limit).Order("updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch weeks",
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
		"message":    "Get all Weeks Paginate success",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get All Weeks
func GetAllWeeks(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Week
	db.Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All weeks support",
		"data":    data,
	})
}

// Get one Week by UUID
func GetWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var week models.Week
	db.Where("uuid = ?", uuid).First(&week)
	if week.Week == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Week found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Week found",
			"data":    week,
		},
	)
}

// Get one Week by week string
func GetWeekByWeekString(c *fiber.Ctx) error {
	weekStr := c.Params("week")
	db := database.DB
	var week models.Week
	db.Where("week = ?", weekStr).First(&week)
	if week.Week == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Week found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Week found",
			"data":    week,
		},
	)
}

// Create Week
func CreateWeek(c *fiber.Ctx) error {
	p := &models.Week{}

	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	p.UUID = uuid.New().String()

	// Log the parsed struct for diagnostics
	fmt.Printf("Parsed week struct: %+v\n", p)

	result := database.DB.Create(p)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to create week",
			"error":   result.Error.Error(),
			"data":    p,
		})
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Week created success",
			"data":    p,
		},
	)
}

// Update Week
func UpdateWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateData struct {
		UUID         string `json:"uuid"`
		Week         string `json:"week"`
		Quantity     string `json:"quantity"`
		Role         string `json:"role"`
		ProvinceUUID string `json:"province_uuid"`
		ProductUUID  string `json:"product_uuid"`
		MonthUUID    string `json:"month_uuid"`
		YearUUID     string `json:"year_uuid"`
		Signature    string `json:"signature"`
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

	week := new(models.Week)
	db.Where("uuid = ?", uuid).First(&week)
	week.Week = updateData.Week
	week.Quantity = updateData.Quantity
	week.Role = updateData.Role
	week.ProvinceUUID = updateData.ProvinceUUID
	week.ProductUUID = updateData.ProductUUID
	week.MonthUUID = updateData.MonthUUID
	week.YearUUID = updateData.YearUUID
	week.Signature = updateData.Signature
	db.Save(&week)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Week updated success",
			"data":    week,
		},
	)
}

// Delete Week
func DeleteWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	var week models.Week
	db.Where("uuid = ?", uuid).First(&week)
	if week.Week == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Week found",
				"data":    nil,
			},
		)
	}
	db.Delete(&week)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Week deleted success",
			"data":    nil,
		},
	)
}
