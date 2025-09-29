package month

import (
	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

func CreateMonth(c *fiber.Ctx) error {
	month := new(models.Month)
	if err := c.BodyParser(month); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Create(&month).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(month)
}

func GetAllMonths(c *fiber.Ctx) error {
	var months []models.Month
	if err := database.DB.Find(&months).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(months)
}

func GetMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var month models.Month
	if err := database.DB.First(&month, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Month not found"})
	}
	return c.JSON(month)
}

func UpdateMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var month models.Month
	if err := database.DB.First(&month, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Month not found"})
	}
	if err := c.BodyParser(&month); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Save(&month).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(month)
}

func DeleteMonth(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if err := database.DB.Delete(&models.Month{}, "uuid = ?", uuid).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
