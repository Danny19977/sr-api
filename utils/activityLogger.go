package utils

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/Danny19977/mypg-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ActivityLogger handles logging user activities
type ActivityLogger struct {
	DB *gorm.DB
}

// NewActivityLogger creates a new activity logger instance
func NewActivityLogger(db *gorm.DB) *ActivityLogger {
	return &ActivityLogger{
		DB: db,
	}
}

// LogUserActivity logs a user activity to the database
func (al *ActivityLogger) LogUserActivity(c *fiber.Ctx, action, name, description string, additionalData map[string]interface{}) error {
	// Get user UUID from token
	userUUID, err := GetUserUUIDFromToken(c)
	if err != nil {
		// Don't fail the main operation if logging fails
		fmt.Printf("Warning: Could not log activity - %v\n", err)
		return nil
	}

	// Create log entry
	logEntry := &models.UserLogs{
		UUID:        uuid.New().String(),
		Name:        name,
		Action:      strings.ToUpper(action),
		Description: description,
		UserUUID:    userUUID,
		Signature:   al.generateSignature(action, name, userUUID),
	}

	// Add additional data to description if provided
	if len(additionalData) > 0 {
		if additionalDataJSON, err := json.Marshal(additionalData); err == nil {
			logEntry.Description = fmt.Sprintf("%s | Additional Data: %s", description, string(additionalDataJSON))
		}
	}

	// Save to database
	if err := al.DB.Create(logEntry).Error; err != nil {
		fmt.Printf("Error saving activity log: %v\n", err)
		return err
	}

	fmt.Printf("✅ Activity logged: %s - %s for user %s\n", action, name, userUUID)
	return nil
}

// LogLogin logs user login activity
func (al *ActivityLogger) LogLogin(c *fiber.Ctx, userUUID string, userInfo map[string]interface{}) error {
	return al.LogUserActivity(c, "LOGIN", "user_login",
		fmt.Sprintf("User logged into the system from %s", al.getClientInfo(c)),
		map[string]interface{}{
			"client_info": al.getClientInfo(c),
			"ip_address":  c.IP(),
			"user_agent":  c.Get("User-Agent"),
			"user_info":   userInfo,
		})
}

// LogLogout logs user logout activity
func (al *ActivityLogger) LogLogout(c *fiber.Ctx, userUUID string) error {
	return al.LogUserActivity(c, "LOGOUT", "user_logout",
		"User logged out of the system",
		map[string]interface{}{
			"ip_address": c.IP(),
			"user_agent": c.Get("User-Agent"),
		})
}

// LogCreate logs entity creation
func (al *ActivityLogger) LogCreate(c *fiber.Ctx, entityType, entityName, entityID string) error {
	return al.LogUserActivity(c, "CREATE", fmt.Sprintf("create_%s", entityType),
		fmt.Sprintf("Created new %s: %s", entityType, entityName),
		map[string]interface{}{
			"entity_type": entityType,
			"entity_name": entityName,
			"entity_id":   entityID,
		})
}

// LogUpdate logs entity update
func (al *ActivityLogger) LogUpdate(c *fiber.Ctx, entityType, entityName, entityID string, changes map[string]interface{}) error {
	var changesList []string
	for key := range changes {
		changesList = append(changesList, key)
	}

	return al.LogUserActivity(c, "UPDATE", fmt.Sprintf("update_%s", entityType),
		fmt.Sprintf("Updated %s: %s", entityType, entityName),
		map[string]interface{}{
			"entity_type": entityType,
			"entity_name": entityName,
			"entity_id":   entityID,
			"changes":     changesList,
		})
}

// LogDelete logs entity deletion
func (al *ActivityLogger) LogDelete(c *fiber.Ctx, entityType, entityName, entityID string) error {
	return al.LogUserActivity(c, "DELETE", fmt.Sprintf("delete_%s", entityType),
		fmt.Sprintf("Deleted %s: %s", entityType, entityName),
		map[string]interface{}{
			"entity_type": entityType,
			"entity_name": entityName,
			"entity_id":   entityID,
		})
}

// LogView logs entity view/access
func (al *ActivityLogger) LogView(c *fiber.Ctx, entityType, entityName, entityID string) error {
	return al.LogUserActivity(c, "VIEW", fmt.Sprintf("view_%s", entityType),
		fmt.Sprintf("Viewed %s: %s", entityType, entityName),
		map[string]interface{}{
			"entity_type": entityType,
			"entity_name": entityName,
			"entity_id":   entityID,
		})
}

// LogAPICall logs API endpoint access
func (al *ActivityLogger) LogAPICall(c *fiber.Ctx, endpoint, method string, responseStatus int) error {
	return al.LogUserActivity(c, "API_CALL", fmt.Sprintf("api_%s", strings.ToLower(method)),
		fmt.Sprintf("Called API endpoint: %s %s (Status: %d)", method, endpoint, responseStatus),
		map[string]interface{}{
			"endpoint":        endpoint,
			"method":          method,
			"response_status": responseStatus,
			"ip_address":      c.IP(),
			"user_agent":      c.Get("User-Agent"),
		})
}

// LogError logs system errors
func (al *ActivityLogger) LogError(c *fiber.Ctx, errorType, errorMessage string, context map[string]interface{}) error {
	userUUID, _ := GetUserUUIDFromToken(c) // Get if available, but don't fail if not

	logEntry := &models.UserLogs{
		UUID:        uuid.New().String(),
		Name:        fmt.Sprintf("error_%s", errorType),
		Action:      "ERROR",
		Description: fmt.Sprintf("System error: %s", errorMessage),
		UserUUID:    userUUID, // May be empty for system errors
		Signature:   al.generateSignature("ERROR", errorType, userUUID),
	}

	// Add context to description
	if len(context) > 0 {
		if contextJSON, err := json.Marshal(context); err == nil {
			logEntry.Description = fmt.Sprintf("%s | Context: %s", logEntry.Description, string(contextJSON))
		}
	}

	return al.DB.Create(logEntry).Error
}

// Helper methods
func (al *ActivityLogger) generateSignature(action, name, userUUID string) string {
	timestamp := time.Now().Format(time.RFC3339)
	data := fmt.Sprintf("%s:%s:%s:%s", action, name, userUUID, timestamp)
	// Simple base64 encoding for signature
	return fmt.Sprintf("%x", []byte(data))
}

func (al *ActivityLogger) getClientInfo(c *fiber.Ctx) string {
	userAgent := c.Get("User-Agent")
	if userAgent == "" {
		return "Unknown Client"
	}

	// Parse basic browser info
	browser := "Unknown Browser"
	if strings.Contains(userAgent, "Chrome") {
		browser = "Chrome"
	} else if strings.Contains(userAgent, "Firefox") {
		browser = "Firefox"
	} else if strings.Contains(userAgent, "Safari") {
		browser = "Safari"
	} else if strings.Contains(userAgent, "Edge") {
		browser = "Edge"
	}

	return fmt.Sprintf("%s from IP %s", browser, c.IP())
}

// Convenience functions that can be used with database instance
func LogUserActivityWithDB(db *gorm.DB, c *fiber.Ctx, action, name, description string, additionalData map[string]interface{}) error {
	logger := NewActivityLogger(db)
	return logger.LogUserActivity(c, action, name, description, additionalData)
}

func LogLoginWithDB(db *gorm.DB, c *fiber.Ctx, userUUID string, userInfo map[string]interface{}) error {
	logger := NewActivityLogger(db)
	return logger.LogLogin(c, userUUID, userInfo)
}

func LogLogoutWithDB(db *gorm.DB, c *fiber.Ctx, userUUID string) error {
	logger := NewActivityLogger(db)
	return logger.LogLogout(c, userUUID)
}

func LogCreateWithDB(db *gorm.DB, c *fiber.Ctx, entityType, entityName, entityID string) error {
	logger := NewActivityLogger(db)
	return logger.LogCreate(c, entityType, entityName, entityID)
}

func LogUpdateWithDB(db *gorm.DB, c *fiber.Ctx, entityType, entityName, entityID string, changes map[string]interface{}) error {
	logger := NewActivityLogger(db)
	return logger.LogUpdate(c, entityType, entityName, entityID, changes)
}

func LogDeleteWithDB(db *gorm.DB, c *fiber.Ctx, entityType, entityName, entityID string) error {
	logger := NewActivityLogger(db)
	return logger.LogDelete(c, entityType, entityName, entityID)
}

func LogViewWithDB(db *gorm.DB, c *fiber.Ctx, entityType, entityName, entityID string) error {
	logger := NewActivityLogger(db)
	return logger.LogView(c, entityType, entityName, entityID)
}

func LogAPICallWithDB(db *gorm.DB, c *fiber.Ctx, endpoint, method string, responseStatus int) error {
	logger := NewActivityLogger(db)
	return logger.LogAPICall(c, endpoint, method, responseStatus)
}

func LogErrorWithDB(db *gorm.DB, c *fiber.Ctx, errorType, errorMessage string, context map[string]interface{}) error {
	logger := NewActivityLogger(db)
	return logger.LogError(c, errorType, errorMessage, context)
}
