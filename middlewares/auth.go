package middlewares

import (
	"strings"

	"github.com/Danny19977/mypg-api/utils"
	"github.com/gofiber/fiber/v2"
)

func IsAuthenticated(c *fiber.Ctx) error {

	// Get token from Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(fiber.Map{
			"message": "authorization header required",
		})
	}

	// Extract token from "Bearer <token>" format
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(fiber.Map{
			"message": "invalid authorization header format",
		})
	}

	token := tokenParts[1]

	if _, err := utils.VerifyJwt(token); err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(fiber.Map{
			"message": "invalid or expired token",
		})
	}
	c.Next()
	return nil
}
