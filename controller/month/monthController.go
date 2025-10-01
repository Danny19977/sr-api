package month

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/Danny19977/sr-api/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Paginate Months
func GetPaginatedMonth(c *fiber.Ctx) error {
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

	var dataList []models.Month
	var totalRecords int64

	userUUID, _ := utils.GetUserUUIDFromToken(c)
	var requestingUser models.User
	database.DB.Where("uuid = ?", userUUID).First(&requestingUser)

	query := db.Model(&models.Month{})
	if requestingUser.Role == "ASM" {
		query = query.Where("province_uuid = ?", requestingUser.ProvinceUUID)
	}
	query = query.Where("month ILIKE ?", "%"+search+"%")
	query.Count(&totalRecords)

	query = query.Offset(offset).Limit(limit).Order("updated_at DESC")
	err = query.Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch months",
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
		"message":    "Get all Months Paginate success",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get All Months
func GetAllMonths(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Month
	db.Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All months support",
		"data":    data,
	})
}

// Get one Month by UUID
func GetMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var month models.Month
	db.Where("uuid = ?", uuid).First(&month)
	if month.Month == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Month found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Month found",
			"data":    month,
		},
	)
}

// Get one Month by month string
func GetMonthByMonthString(c *fiber.Ctx) error {
	monthStr := c.Params("month")
	db := database.DB
	var month models.Month
	db.Where("month = ?", monthStr).First(&month)
	if month.Month == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Month found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Month found",
			"data":    month,
		},
	)
}

// Create Month
func CreateMonth(c *fiber.Ctx) error {
	p := &models.Month{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Month created success",
			"data":    p,
		},
	)
}

// Update Month
func UpdateMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateData struct {
		UUID         string `json:"uuid"`
		Month        string `json:"month"`
		Quantity     string `json:"quantity"`
		Role         string `json:"role"`
		CountryUUID  string `json:"country_uuid"`
		ProvinceUUID string `json:"province_uuid"`
		ProductUUID  string `json:"product_uuid"`
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

	month := new(models.Month)
	db.Where("uuid = ?", uuid).First(&month)
	month.Month = updateData.Month
	month.Quantity = updateData.Quantity
	month.Role = updateData.Role
	month.CountryUUID = updateData.CountryUUID
	month.ProvinceUUID = updateData.ProvinceUUID
	month.ProductUUID = updateData.ProductUUID
	month.YearUUID = updateData.YearUUID
	month.Signature = updateData.Signature
	db.Save(&month)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Month updated success",
			"data":    month,
		},
	)
}

// Delete Month
func DeleteMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	var month models.Month
	db.Where("uuid = ?", uuid).First(&month)
	if month.Month == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Month found",
				"data":    nil,
			},
		)
	}
	db.Delete(&month)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Month deleted success",
			"data":    nil,
		},
	)
}
