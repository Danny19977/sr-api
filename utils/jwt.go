package utils

import (
	"errors"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

var SECRET_KEY string = os.Getenv("SECRET_KEY")

func GenerateJwt(issuer string) (string, error) {

	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, &jwt.StandardClaims{
		Issuer:    issuer,
		ExpiresAt: time.Now().Add(time.Hour * 72).Unix(), // 3 days
	})

	token, err := claims.SignedString([]byte(SECRET_KEY))

	return token, err
}

func VerifyJwt(token string) (string, error) {

	parsedToken, err := jwt.ParseWithClaims(token, &jwt.StandardClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(SECRET_KEY), nil
	})

	if err != nil || !parsedToken.Valid {
		return "", err
	}

	claims := parsedToken.Claims.(*jwt.StandardClaims)

	return claims.Issuer, nil
}

// GetTokenFromHeader extracts JWT token from Authorization header
func GetTokenFromHeader(c *fiber.Ctx) (string, error) {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header required")
	}

	// Extract token from "Bearer <token>" format
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return "", errors.New("invalid authorization header format")
	}

	return tokenParts[1], nil
}

// GetUserUUIDFromToken extracts user UUID from JWT token in Authorization header
func GetUserUUIDFromToken(c *fiber.Ctx) (string, error) {
	token, err := GetTokenFromHeader(c)
	if err != nil {
		return "", err
	}

	userUUID, err := VerifyJwt(token)
	if err != nil {
		return "", errors.New("invalid or expired token")
	}

	return userUUID, nil
}
