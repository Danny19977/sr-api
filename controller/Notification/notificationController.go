package notification

import (
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/Danny19977/sr-api/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// Paginate Notifications
func GetPaginatedNotification(c *fiber.Ctx) error {
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

	var dataList []models.Notification
	var totalRecords int64

	userUUID, _ := utils.GetUserUUIDFromToken(c)
	var requestingUser models.User
	database.DB.Where("uuid = ?", userUUID).First(&requestingUser)

	query := db.Model(&models.Notification{})
	if requestingUser.Role == "ASM" {
		query = query.Where("province_uuid = ?", requestingUser.ProvinceUUID)
	}
	query = query.Where("name ILIKE ?", "%"+search+"%")
	query.Count(&totalRecords)

	query = query.Offset(offset).Limit(limit).Order("updated_at DESC")
	err = query.Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch notifications",
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
		"message":    "Get all Notifications Paginate success",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get All Notifications
func GetAllNotifications(c *fiber.Ctx) error {
	db := database.DB
	var data []models.Notification
	db.Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All notifications support",
		"data":    data,
	})
}

// Get one Notification by UUID
func GetNotification(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var notification models.Notification
	db.Where("uuid = ?", uuid).First(&notification)
	if notification.Name == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Notification found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Notification found",
			"data":    notification,
		},
	)
}

// Get one Notification by title string
func GetNotificationByTitleString(c *fiber.Ctx) error {
	nameStr := c.Params("title")
	db := database.DB
	var notification models.Notification
	db.Where("name = ?", nameStr).First(&notification)
	if notification.Name == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Notification found",
				"data":    nil,
			},
		)
	}
	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Notification found",
			"data":    notification,
		},
	)
}

// Create Notification
func CreateNotification(c *fiber.Ctx) error {
	p := &models.Notification{}

	if err := c.BodyParser(&p); err != nil {
		return err
	}

	p.UUID = uuid.New().String()
	database.DB.Create(p)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Notification created success",
			"data":    p,
		},
	)
}

// Update Notification
func UpdateNotification(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	type UpdateData struct {
		UUID     string `json:"uuid"`
		Name     string `json:"name"`
		Message  string `json:"message"`
		Type     string `json:"type"`
		Status   string `json:"status"`
		UserUUID string `json:"user_uuid"`
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

	notification := new(models.Notification)
	db.Where("uuid = ?", uuid).First(&notification)
	notification.Name = updateData.Name
	notification.Message = updateData.Message
	notification.Type = updateData.Type
	notification.Status = updateData.Status
	notification.UserUUID = updateData.UserUUID
	db.Save(&notification)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Notification updated success",
			"data":    notification,
		},
	)
}

// Delete Notification
func DeleteNotification(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB

	var notification models.Notification
	db.Where("uuid = ?", uuid).First(&notification)
	if notification.Name == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No Notification found",
				"data":    nil,
			},
		)
	}
	db.Delete(&notification)

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Notification deleted success",
			"data":    nil,
		},
	)
}
