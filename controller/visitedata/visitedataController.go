package visitedata

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// MapImageData is used for map card image gallery

type MapImageData struct {
	FileURL   []string `json:"file_url"` // Array of image URLs
	Latitude  *float64 `json:"latitude"`
	Longitude *float64 `json:"longitude"`
	TextValue string   `json:"text_value"`
	CreatedAt string   `json:"created_at"`
}

// GetVisiteDataImagesForMap returns file_url, latitude, longitude, text_value for each entry
func GetVisiteDataImagesForMap(c *fiber.Ctx) error {
	db := database.DB
	// Temporary struct to fetch file_url as string
	type rawImageData struct {
		FileURL   string   `json:"file_url"`
		Latitude  *float64 `json:"latitude"`
		Longitude *float64 `json:"longitude"`
		TextValue string   `json:"text_value"`
		CreatedAt string   `json:"created_at"`
	}
	var rawResults []rawImageData
	err := db.Model(&models.VisiteData{}).
		Select("file_url, latitude, longitude, text_value, created_at").
		Where("file_url IS NOT NULL AND file_url != '' AND latitude IS NOT NULL AND longitude IS NOT NULL").
		Order("created_at").
		Find(&rawResults).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch map images data",
			"error":   err.Error(),
		})
	}
	// Convert file_url string to []string
	var results []MapImageData
	for _, r := range rawResults {
		var urls []string
		if r.FileURL != "" {
			_ = json.Unmarshal([]byte(r.FileURL), &urls)
		}
		results = append(results, MapImageData{
			FileURL:   urls,
			Latitude:  r.Latitude,
			Longitude: r.Longitude,
			TextValue: r.TextValue,
			CreatedAt: r.CreatedAt,
		})
	}
	return c.Status(200).JSON(fiber.Map{
		"status":  "success",
		"message": "Map images data retrieved successfully",
		"data":    results,
	})
}

// Get paginated form field responses
func GetPaginatedVisiteDatas(c *fiber.Ctx) error {
	db := database.DB

	// Parse query parameters for pagination
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page <= 0 {
		page = 1
	}
	limit, err := strconv.Atoi(c.Query("limit", "15"))
	if err != nil || limit <= 0 {
		limit = 15
	}
	offset := (page - 1) * limit

	// Parse search query
	search := c.Query("search", "")

	var dataList []models.VisiteData
	var totalRecords int64

	// Count total records matching the search query
	db.Model(&models.VisiteData{}).
		Where("text_value ILIKE ? OR file_url ILIKE ?", "%"+search+"%", "%"+search+"%").
		Count(&totalRecords)

	// Fetch paginated data
	err = db.
		Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("text_value ILIKE ? OR file_url ILIKE ?", "%"+search+"%", "%"+search+"%").
		Offset(offset).
		Limit(limit).
		Order("updated_at DESC").
		Find(&dataList).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form responses",
			"error":   err.Error(),
		})
	}

	// Calculate total pages
	totalPages := int((totalRecords + int64(limit) - 1) / int64(limit))

	// Prepare pagination metadata
	pagination := map[string]interface{}{
		"total_records": totalRecords,
		"total_pages":   totalPages,
		"current_page":  page,
		"page_size":     limit,
	}

	// Return response
	return c.JSON(fiber.Map{
		"status":     "success",
		"message":    "Form responses retrieved successfully",
		"data":       dataList,
		"pagination": pagination,
	})
}

// Get all form field responses
func GetAllVisiteDatas(c *fiber.Ctx) error {
	db := database.DB
	var data []models.VisiteData
	db.Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").Find(&data)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "All Form Responses",
		"data":    data,
	})
}

// Get one form response by UUID
func GetVisiteData(c *fiber.Ctx) error {
	uuid := c.Params("uuid")
	db := database.DB
	var visiteData models.VisiteData
	db.Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").Where("uuid = ?", uuid).First(&visiteData)
	if visiteData.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form response found",
				"data":    nil,
			},
		)
	}
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form response found",
		"data":    visiteData,
	})
}

// Create a form response
func CreateVisiteData(c *fiber.Ctx) error {
	p := &models.VisiteData{}

	if err := c.BodyParser(&p); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	// Validate GPS coordinates if provided
	if p.Latitude != nil && (*p.Latitude < -90 || *p.Latitude > 90) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid latitude value. Must be between -90 and 90",
		})
	}

	if p.Longitude != nil && (*p.Longitude < -180 || *p.Longitude > 180) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid longitude value. Must be between -180 and 180",
		})
	}

	p.UUID = uuid.New().String()

	// Create with error handling
	if err := database.DB.Create(p).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to create form response",
			"error":   err.Error(),
		})
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form response created successfully",
			"data":    p,
		},
	)
}

// Update a form response
func UpdateVisiteData(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var updateData models.VisiteData

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Review your input",
				"data":    nil,
			},
		)
	}

	var visiteData models.VisiteData
	db.Where("uuid = ?", uuidParam).First(&visiteData)
	if visiteData.UUID == "" {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form response found",
				"data":    nil,
			},
		)
	}

	// Validate GPS coordinates if provided
	if updateData.Latitude != nil && (*updateData.Latitude < -90 || *updateData.Latitude > 90) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid latitude value. Must be between -90 and 90",
		})
	}

	if updateData.Longitude != nil && (*updateData.Longitude < -180 || *updateData.Longitude > 180) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid longitude value. Must be between -180 and 180",
		})
	}

	// Update fields
	visiteData.TextValue = updateData.TextValue
	visiteData.RadioValue = updateData.RadioValue
	visiteData.Checkbox = updateData.Checkbox
	visiteData.Email = updateData.Email
	visiteData.NumberValue = updateData.NumberValue
	visiteData.BooleanValue = updateData.BooleanValue
	visiteData.Comment = updateData.Comment
	visiteData.FileURL = updateData.FileURL
	visiteData.Latitude = updateData.Latitude
	visiteData.Longitude = updateData.Longitude
	visiteData.VisiteHarderUUID = updateData.VisiteHarderUUID
	visiteData.FormItemUUID = updateData.FormItemUUID
	visiteData.UserUUID = updateData.UserUUID
	visiteData.AreaUUID = updateData.AreaUUID
	visiteData.ProvinceUUID = updateData.ProvinceUUID
	visiteData.CountryUUID = updateData.CountryUUID
	visiteData.Signature = updateData.Signature
	visiteData.EntryOrder = updateData.EntryOrder
	visiteData.EntryLabel = updateData.EntryLabel
	visiteData.SubItemID = updateData.SubItemID
	visiteData.ParentEntryID = updateData.ParentEntryID

	if err := db.Save(&visiteData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to update form response",
			"error":   err.Error(),
		})
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form response updated successfully",
			"data":    visiteData,
		},
	)
}

// Delete a form response
func DeleteVisiteData(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	var visiteData models.VisiteData
	// First check if the form response exists
	result := db.Where("uuid = ?", uuidParam).First(&visiteData)
	if result.Error != nil {
		return c.Status(404).JSON(
			fiber.Map{
				"status":  "error",
				"message": "No form response found",
				"data":    nil,
			},
		)
	}

	// Permanently delete from database
	deleteResult := db.Unscoped().Delete(&visiteData)
	if deleteResult.Error != nil {
		return c.Status(500).JSON(
			fiber.Map{
				"status":  "error",
				"message": "Failed to delete form response",
				"error":   deleteResult.Error.Error(),
			},
		)
	}

	return c.JSON(
		fiber.Map{
			"status":  "success",
			"message": "Form response deleted successfully",
			"data":    nil,
		},
	)
}

// Get form responses by submission UUID
func GetVisiteDatasBySubmission(c *fiber.Ctx) error {
	submissionUUID := c.Params("submissionUuid")
	db := database.DB
	var responses []models.VisiteData

	err := db.Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("visite_harder_uuid = ?", submissionUUID).
		Order("created_at ASC").
		Find(&responses).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch submission responses",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Submission responses retrieved successfully",
		"data":    responses,
	})
}

// Get form responses by form item UUID
func GetVisiteDatasByFormItem(c *fiber.Ctx) error {
	formItemUUID := c.Params("formItemUuid")
	db := database.DB
	var responses []models.VisiteData

	err := db.Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("form_item_uuid = ?", formItemUUID).
		Order("created_at DESC").
		Find(&responses).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch form item responses",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Form item responses retrieved successfully",
		"data":    responses,
	})
}

// Get form responses by user UUID
func GetVisiteDatasByUser(c *fiber.Ctx) error {
	userUUID := c.Params("userUuid")
	db := database.DB
	var responses []models.VisiteData

	err := db.Preload("VisiteHarder").Preload("FormItem").Preload("User").Preload("Country").Preload("Province").Preload("Area").
		Where("user_uuid = ?", userUUID).
		Order("created_at DESC").
		Find(&responses).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch user responses",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User responses retrieved successfully",
		"data":    responses,
	})
}

// Update GPS coordinates for a form response
func UpdateVisiteDataGPS(c *fiber.Ctx) error {
	uuidParam := c.Params("uuid")
	db := database.DB

	type GPSData struct {
		Latitude  *float64 `json:"latitude"`
		Longitude *float64 `json:"longitude"`
	}

	var gpsData GPSData
	if err := c.BodyParser(&gpsData); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid GPS data format",
			"error":   err.Error(),
		})
	}

	// Validate GPS coordinates
	if gpsData.Latitude != nil && (*gpsData.Latitude < -90 || *gpsData.Latitude > 90) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid latitude value. Must be between -90 and 90",
		})
	}

	if gpsData.Longitude != nil && (*gpsData.Longitude < -180 || *gpsData.Longitude > 180) {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid longitude value. Must be between -180 and 180",
		})
	}

	var visiteData models.VisiteData
	if err := db.Where("uuid = ?", uuidParam).First(&visiteData).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"status":  "error",
			"message": "No form response found",
		})
	}

	// Update only GPS coordinates
	visiteData.Latitude = gpsData.Latitude
	visiteData.Longitude = gpsData.Longitude

	if err := db.Save(&visiteData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to update GPS coordinates",
			"error":   err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "GPS coordinates updated successfully",
		"data": fiber.Map{
			"uuid":      visiteData.UUID,
			"latitude":  visiteData.Latitude,
			"longitude": visiteData.Longitude,
		},
	})
}

// Create multiple form responses (bulk submission)
func CreateBulkVisiteData(c *fiber.Ctx) error {
	var requestData struct {
		VisiteHarderUUID string              `json:"visite_harder_uuid"`
		Responses        []models.VisiteData `json:"responses"`
	}

	if err := c.BodyParser(&requestData); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	if len(requestData.Responses) == 0 {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "No responses provided",
		})
	}

	// Process each response
	var createdResponses []models.VisiteData
	var errors []string

	for i, response := range requestData.Responses {
		// Set the submission UUID
		response.VisiteHarderUUID = requestData.VisiteHarderUUID

		// Generate UUID
		response.UUID = uuid.New().String()

		// Set entry order if not provided
		if response.EntryOrder == 0 {
			response.EntryOrder = i + 1
		}

		// Validate GPS coordinates if provided
		if response.Latitude != nil && (*response.Latitude < -90 || *response.Latitude > 90) {
			errors = append(errors, fmt.Sprintf("Entry %d: Invalid latitude value", i+1))
			continue
		}

		if response.Longitude != nil && (*response.Longitude < -180 || *response.Longitude > 180) {
			errors = append(errors, fmt.Sprintf("Entry %d: Invalid longitude value", i+1))
			continue
		}

		// Create response
		if err := database.DB.Create(&response).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Entry %d: %s", i+1, err.Error()))
			continue
		}

		createdResponses = append(createdResponses, response)
	}

	// Return results
	result := fiber.Map{
		"status":            "success",
		"message":           fmt.Sprintf("Processed %d responses", len(requestData.Responses)),
		"created_count":     len(createdResponses),
		"error_count":       len(errors),
		"created_responses": createdResponses,
	}

	if len(errors) > 0 {
		result["errors"] = errors
		if len(createdResponses) == 0 {
			result["status"] = "error"
			result["message"] = "Failed to create any responses"
			return c.Status(400).JSON(result)
		} else {
			result["status"] = "partial_success"
			result["message"] = fmt.Sprintf("Created %d out of %d responses", len(createdResponses), len(requestData.Responses))
		}
	}

	return c.JSON(result)
}

// Get responses grouped by form item for analysis
func GetResponsesByFormItem(c *fiber.Ctx) error {
	formItemUUID := c.Params("formItemUuid")
	visiteHarderUUID := c.Query("visite_harder_uuid", "")

	db := database.DB.Model(&models.VisiteData{})

	if visiteHarderUUID != "" {
		db = db.Where("visite_harder_uuid = ?", visiteHarderUUID)
	}

	var responses []models.VisiteData
	err := db.Where("form_item_uuid = ?", formItemUUID).
		Order("entry_order ASC, created_at ASC").
		Find(&responses).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch responses",
			"error":   err.Error(),
		})
	}

	// Group responses for analysis
	groupedData := make(map[string][]models.VisiteData)
	summary := make(map[string]interface{})

	for _, response := range responses {
		groupKey := response.VisiteHarderUUID
		if groupKey == "" {
			groupKey = "ungrouped"
		}

		groupedData[groupKey] = append(groupedData[groupKey], response)
	}

	summary["total_responses"] = len(responses)
	summary["total_submissions"] = len(groupedData)
	summary["multiple_entries_count"] = 0

	for _, group := range groupedData {
		if len(group) > 1 {
			summary["multiple_entries_count"] = summary["multiple_entries_count"].(int) + 1
		}
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Responses retrieved successfully",
		"data": fiber.Map{
			"responses":    responses,
			"grouped_data": groupedData,
			"summary":      summary,
		},
	})
}

// MapMarkerData represents the structure for map marker response
type MapMarkerData struct {
	ID               int     `json:"id"`
	VisiteHarderUUID string  `json:"visite_harder_uuid"`
	Latitude         float64 `json:"latitude"`
	Longitude        float64 `json:"longitude"`
	TextValue        string  `json:"text_value"`
	NumberValue      float64 `json:"number_value"`
	EntryOrder       int     `json:"entry_order"`
	UserName         string  `json:"user_name"`
	UserUUID         string  `json:"user_uuid"`
	Email            string  `json:"email"`
	AreaName         string  `json:"area_name"`
	AreaUUID         string  `json:"area_uuid"`
	ProvinceName     string  `json:"province_name"`
	ProvinceUUID     string  `json:"province_uuid"`
	CountryName      string  `json:"country_name"`
	CountryUUID      string  `json:"country_uuid"`
	CreatedAt        string  `json:"created_at"`
}

// GetMapMarkers gets map markers data grouped by visite_harder_uuid with GPS coordinates
func GetMapMarkers(c *fiber.Ctx) error {
	db := database.DB

	var visiteDatas []models.VisiteData

	// Use GORM with preloaded relationships
	err := db.Preload("User").Preload("Area").Preload("Province").Preload("Country").
		Where("latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != 0 AND longitude != 0").
		Order("created_at DESC").
		Find(&visiteDatas).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to retrieve map markers data",
			"error":   err.Error(),
		})
	}

	// Transform the data to the desired format
	var markers []MapMarkerData
	for i, vd := range visiteDatas {
		marker := MapMarkerData{
			ID:               i + 1,
			VisiteHarderUUID: vd.VisiteHarderUUID,
			Latitude:         vd.GetLatitude(),
			Longitude:        vd.GetLongitude(),
			TextValue:        vd.TextValue,
			NumberValue: func() float64 {
				if vd.NumberValue != nil {
					return *vd.NumberValue
				} else {
					return 0
				}
			}(),
			EntryOrder:   vd.EntryOrder,
			UserUUID:     vd.UserUUID,
			AreaUUID:     vd.AreaUUID,
			ProvinceUUID: vd.ProvinceUUID,
			CountryUUID:  vd.CountryUUID,
			CreatedAt:    vd.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		// Set user data if available
		if vd.User != nil {
			marker.UserName = vd.User.Fullname
			marker.Email = vd.User.Email
		}

		// Set area data if available
		if vd.Area != nil {
			marker.AreaName = vd.Area.Name
		}

		// Set province data if available
		if vd.Province != nil {
			marker.ProvinceName = vd.Province.Name
		}

		// Set country data if available
		if vd.Country != nil {
			marker.CountryName = vd.Country.Name
		}

		markers = append(markers, marker)
	}

	return c.Status(200).JSON(fiber.Map{
		"status":  "success",
		"message": "Map markers data retrieved successfully",
		"data":    markers,
	})
}
