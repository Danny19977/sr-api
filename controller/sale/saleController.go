package Sale

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Paginate Sale
func GetPaginatedSale(c *fiber.Ctx) error {
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

	var dataList []models.Sale
	var totalRecords int64

	countQuery := db.Model(&models.Sale{}).Where("user_uuid ILIKE ?", "%"+search+"%") // Example: search by user_uuid
	countQuery.Count(&totalRecords)

	query := db.Where("user_uuid ILIKE ?", "%"+search+"%")
	query = query.Offset(offset)
	query = query.Limit(limit)
	query = query.Order("updated_at DESC")
	err = query.Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch Sale",
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
		"message":    "Get all Sale Paginate success",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get All Sale
func GetAllSale(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Sale
	db.Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Sale fetched",
		"data":    data,
	})
}

// Get Sale by Province
func GetSaleByProvince(c *fiber.Ctx) error {
	db := database.DB
	provinceUUID := c.Params("province_uuid")
	var data []models.Sale
	db.Where("province_uuid = ?", provinceUUID).Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sale by province fetched",
		"data":    data,
	})
}

// Get one Sale
func GetSale(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var sale models.Sale
	db.Where("uuid = ?", uuid).First(&sale)
	if sale.UUID == "" {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "No Sale found",
			"data":    nil,
		})
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sale found",
		"data":    sale,
	})
}

// Create Sale
func CreateSale(c *fiber.Ctx) error {
	s := &models.Sale{}
	if err := c.BodyParser(&s); err != nil {
		return err
	}
	s.UUID = uuid.New().String()
	database.DB.Create(s)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sale created successfully",
		"data":    s,
	})
}

// Update Sale
func UpdateSale(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateData struct {
		UUID         string `json:"uuid"`
		ProvinceUUID string `json:"province_uuid"`
		ProductUUID  string `json:"product_uuid"`
		UserUUID     string `json:"user_uuid"`
		Quantity     int64  `json:"quantity"`
	}

	var updateData UpdateData
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Review your input",
			"data":    nil,
		})
	}

	sale := new(models.Sale)
	db.Where("uuid = ?", uuid).First(&sale)
	sale.ProvinceUUID = updateData.ProvinceUUID
	sale.ProductUUID = updateData.ProductUUID
	sale.UserUUID = updateData.UserUUID
	sale.Quantity = updateData.Quantity

	db.Save(&sale)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sale updated successfully",
		"data":    sale,
	})
}

// Delete Sale
func DeleteSale(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var sale models.Sale
	db.Where("uuid = ?", uuid).First(&sale)
	if sale.UUID == "" {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "No Sale found",
			"data":    nil,
		})
	}
	db.Delete(&sale)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sale deleted successfully",
		"data":    nil,
	})
}
