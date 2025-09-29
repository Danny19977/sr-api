package week

import (
	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

func CreateWeek(c *fiber.Ctx) error {
	week := new(models.Week)
	if err := c.BodyParser(week); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Create(&week).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(week)
}

func GetAllWeeks(c *fiber.Ctx) error {
	var weeks []models.Week
	if err := database.DB.Find(&weeks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(weeks)
}

func GetWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var week models.Week
	if err := database.DB.First(&week, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Week not found"})
	}
	return c.JSON(week)
}

func UpdateWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var week models.Week
	if err := database.DB.First(&week, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Week not found"})
	}
	if err := c.BodyParser(&week); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Save(&week).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(week)
}

func DeleteWeek(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if err := database.DB.Delete(&models.Week{}, "uuid = ?", uuid).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
