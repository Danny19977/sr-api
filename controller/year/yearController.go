package year

import (
	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

func CreateYear(c *fiber.Ctx) error {
	year := new(models.Year)
	if err := c.BodyParser(year); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Create(&year).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(year)
}

func GetAllYears(c *fiber.Ctx) error {
	var years []models.Year
	if err := database.DB.Find(&years).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(years)
}

func GetYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var year models.Year
	if err := database.DB.First(&year, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Year not found"})
	}
	return c.JSON(year)
}

func UpdateYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	var year models.Year
	if err := database.DB.First(&year, "uuid = ?", uuid).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Year not found"})
	}
	if err := c.BodyParser(&year); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}
	if err := database.DB.Save(&year).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(year)
}

func DeleteYear(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	if err := database.DB.Delete(&models.Year{}, "uuid = ?", uuid).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
