package main

import (
	"log"
	"os"
	"strings"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = ":8000"
	} else {
		port = ":" + port
	}

	return port
}

func main() {

	database.Connect()

	app := fiber.New()

	// Initialize default config
	app.Use(logger.New())

	// Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://192.168.0.70:3000,http://192.168.0.16:3000,http://192.168.39.144:3000,http://192.168.0.70.229:3000,http://192.168.39.229:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
		AllowMethods: strings.Join([]string{
			fiber.MethodGet,
			fiber.MethodPost,
			fiber.MethodHead,
			fiber.MethodPut,
			fiber.MethodDelete,
			fiber.MethodPatch,
			fiber.MethodOptions,
		}, ","),
	}))

	// routes.Setup(app)
	routes.Setup(app)

	log.Fatal(app.Listen(getPort()))

}
