package dashboard

import (
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Dashboard Summary Response Structure
type DashboardSummary struct {
	TotalSales      int64               `json:"total_sales"`
	TotalQuantity   int64               `json:"total_quantity"`
	TotalSalesUsers int64               `json:"total_sales_users"`
	TodaySales      int64               `json:"today_sales"`
	TodayQuantity   int64               `json:"today_quantity"`
	TimeSlots       []TimeSlotSummary   `json:"time_slots"`
	TopProducts     []ProductSummary    `json:"top_products"`
	TopProvinces    []ProvinceSummary   `json:"top_provinces"`
	RecentSales     []models.Sale       `json:"recent_sales"`
	TeamPerformance []TeamMemberSummary `json:"team_performance"`
}

type TimeSlotSummary struct {
	TimeSlot      string `json:"time_slot"`
	SalesCount    int64  `json:"sales_count"`
	TotalQuantity int64  `json:"total_quantity"`
	Hour          int    `json:"hour"`
}

type ProductSummary struct {
	ProductUUID   string `json:"product_uuid"`
	ProductName   string `json:"product_name"`
	SalesCount    int64  `json:"sales_count"`
	TotalQuantity int64  `json:"total_quantity"`
}

type ProvinceSummary struct {
	ProvinceUUID  string `json:"province_uuid"`
	ProvinceName  string `json:"province_name"`
	CountryName   string `json:"country_name"`
	SalesCount    int64  `json:"sales_count"`
	TotalQuantity int64  `json:"total_quantity"`
}

type TeamMemberSummary struct {
	UserUUID      string     `json:"user_uuid"`
	UserName      string     `json:"user_name"`
	UserTitle     string     `json:"user_title"`
	SalesCount    int64      `json:"sales_count"`
	TotalQuantity int64      `json:"total_quantity"`
	LastSaleTime  *time.Time `json:"last_sale_time"`
}

// Sales Dashboard Summary - Main endpoint for manager dashboard
func GetSalesDashboardSummary(c *fiber.Ctx) error {
	db := database.DB

	// Get filter parameters
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")
	dateStr := c.Query("date", "")

	// Parse date filter or use today's date
	var filterDate time.Time
	if dateStr != "" {
		var err error
		filterDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid date format. Use YYYY-MM-DD",
				"error":   err.Error(),
			})
		}
	} else {
		filterDate = time.Now()
	}

	// Build base query with filters
	baseQuery := db.Model(&models.Sale{})

	if countryUUID != "" {
		baseQuery = baseQuery.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		baseQuery = baseQuery.Where("province_uuid = ?", provinceUUID)
	}

	// Today's date range
	startOfDay := time.Date(filterDate.Year(), filterDate.Month(), filterDate.Day(), 0, 0, 0, 0, filterDate.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Get total sales (all time with filters)
	var totalSales, totalQuantity int64
	baseQuery.Count(&totalSales)
	baseQuery.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&totalQuantity)

	// Get today's sales
	var todaySales, todayQuantity int64
	todayQuery := baseQuery.Where("created_at >= ? AND created_at < ?", startOfDay, endOfDay)
	todayQuery.Count(&todaySales)
	todayQuery.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&todayQuantity)

	// Get total users who made sales
	var totalSalesUsers int64
	baseQuery.Distinct("user_uuid").Count(&totalSalesUsers)

	// Get time slot summaries (12pm, 3pm, 8pm)
	timeSlots := getTimeSlotSummary(db, startOfDay, endOfDay, countryUUID, provinceUUID)

	// Get top products
	topProducts := getTopProducts(db, startOfDay, endOfDay, countryUUID, provinceUUID, 5)

	// Get top provinces
	topProvinces := getTopProvinces(db, startOfDay, endOfDay, countryUUID, provinceUUID, 5)

	// Get recent sales
	recentSales := getRecentSales(db, countryUUID, provinceUUID, 10)

	// Get team performance
	teamPerformance := getTeamPerformance(db, startOfDay, endOfDay, countryUUID, provinceUUID)

	summary := DashboardSummary{
		TotalSales:      totalSales,
		TotalQuantity:   totalQuantity,
		TotalSalesUsers: totalSalesUsers,
		TodaySales:      todaySales,
		TodayQuantity:   todayQuantity,
		TimeSlots:       timeSlots,
		TopProducts:     topProducts,
		TopProvinces:    topProvinces,
		RecentSales:     recentSales,
		TeamPerformance: teamPerformance,
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Dashboard summary retrieved successfully",
		"data":    summary,
		"filters": fiber.Map{
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
			"date":          filterDate.Format("2006-01-02"),
		},
	})
}

// Get time slot summary for specific hours (12pm, 3pm, 8pm)
func getTimeSlotSummary(db *gorm.DB, startOfDay, endOfDay time.Time, countryUUID, provinceUUID string) []TimeSlotSummary {
	timeSlots := []int{12, 15, 20} // 12pm, 3pm, 8pm in 24-hour format
	var summaries []TimeSlotSummary

	for _, hour := range timeSlots {
		slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), hour, 0, 0, 0, startOfDay.Location())
		slotEnd := slotStart.Add(1 * time.Hour)

		query := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", slotStart, slotEnd)

		if countryUUID != "" {
			query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
				Where("provinces.country_uuid = ?", countryUUID)
		}

		if provinceUUID != "" {
			query = query.Where("province_uuid = ?", provinceUUID)
		}

		var count, quantity int64
		query.Count(&count)
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&quantity)

		var timeSlotName string
		switch hour {
		case 12:
			timeSlotName = "12:00 PM - 1:00 PM"
		case 15:
			timeSlotName = "3:00 PM - 4:00 PM"
		case 20:
			timeSlotName = "8:00 PM - 9:00 PM"
		}

		summaries = append(summaries, TimeSlotSummary{
			TimeSlot:      timeSlotName,
			SalesCount:    count,
			TotalQuantity: quantity,
			Hour:          hour,
		})
	}

	return summaries
}

// Get top products by sales count
func getTopProducts(db *gorm.DB, startOfDay, endOfDay time.Time, countryUUID, provinceUUID string, limit int) []ProductSummary {
	var products []ProductSummary

	query := db.Model(&models.Sale{}).
		Select("product_uuid, products.name as product_name, COUNT(*) as sales_count, SUM(quantity) as total_quantity").
		Joins("JOIN products ON sales.product_uuid = products.uuid").
		Where("sales.created_at >= ? AND sales.created_at < ?", startOfDay, endOfDay).
		Group("product_uuid, products.name").
		Order("sales_count DESC").
		Limit(limit)

	if countryUUID != "" {
		query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("sales.province_uuid = ?", provinceUUID)
	}

	query.Scan(&products)
	return products
}

// Get top provinces by sales count
func getTopProvinces(db *gorm.DB, startOfDay, endOfDay time.Time, countryUUID, provinceUUID string, limit int) []ProvinceSummary {
	var provinces []ProvinceSummary

	query := db.Model(&models.Sale{}).
		Select("provinces.uuid as province_uuid, provinces.name as province_name, countries.name as country_name, COUNT(*) as sales_count, SUM(quantity) as total_quantity").
		Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
		Joins("JOIN countries ON provinces.country_uuid = countries.uuid").
		Where("sales.created_at >= ? AND sales.created_at < ?", startOfDay, endOfDay).
		Group("provinces.uuid, provinces.name, countries.name").
		Order("sales_count DESC").
		Limit(limit)

	if countryUUID != "" {
		query = query.Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("sales.province_uuid = ?", provinceUUID)
	}

	query.Scan(&provinces)
	return provinces
}

// Get recent sales
func getRecentSales(db *gorm.DB, countryUUID, provinceUUID string, limit int) []models.Sale {
	var sales []models.Sale

	query := db.Preload("Province").Preload("Province.Country").Preload("Product").Preload("User").
		Order("created_at DESC").
		Limit(limit)

	if countryUUID != "" {
		query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("province_uuid = ?", provinceUUID)
	}

	query.Find(&sales)
	return sales
}

// Get team performance
func getTeamPerformance(db *gorm.DB, startOfDay, endOfDay time.Time, countryUUID, provinceUUID string) []TeamMemberSummary {
	var team []TeamMemberSummary

	query := db.Model(&models.Sale{}).
		Select("users.uuid as user_uuid, users.fullname as user_name, users.title as user_title, COUNT(*) as sales_count, SUM(quantity) as total_quantity, MAX(sales.created_at) as last_sale_time").
		Joins("JOIN users ON sales.user_uuid = users.uuid").
		Where("sales.created_at >= ? AND sales.created_at < ?", startOfDay, endOfDay).
		Group("users.uuid, users.fullname, users.title").
		Order("sales_count DESC")

	if countryUUID != "" {
		query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("sales.province_uuid = ?", provinceUUID)
	}

	query.Scan(&team)
	return team
}

// Get detailed time-based sales analysis
func GetDetailedTimeAnalysis(c *fiber.Ctx) error {
	db := database.DB

	// Get parameters
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")
	dateStr := c.Query("date", "")

	// Parse date or use today
	var analysisDate time.Time
	if dateStr != "" {
		var err error
		analysisDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid date format. Use YYYY-MM-DD",
			})
		}
	} else {
		analysisDate = time.Now()
	}

	startOfDay := time.Date(analysisDate.Year(), analysisDate.Month(), analysisDate.Day(), 0, 0, 0, 0, analysisDate.Location())

	// Get hourly breakdown for the entire day
	var hourlyData []map[string]interface{}

	for hour := 0; hour < 24; hour++ {
		slotStart := startOfDay.Add(time.Duration(hour) * time.Hour)
		slotEnd := slotStart.Add(1 * time.Hour)

		query := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", slotStart, slotEnd)

		if countryUUID != "" {
			query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
				Where("provinces.country_uuid = ?", countryUUID)
		}

		if provinceUUID != "" {
			query = query.Where("province_uuid = ?", provinceUUID)
		}

		var count, quantity int64
		query.Count(&count)
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&quantity)

		// Determine if this is a key tracking hour
		isKeyHour := hour == 12 || hour == 15 || hour == 20

		hourlyData = append(hourlyData, map[string]interface{}{
			"hour":           hour,
			"time_display":   slotStart.Format("3:04 PM"),
			"sales_count":    count,
			"total_quantity": quantity,
			"is_key_hour":    isKeyHour,
			"period":         getPeriodName(hour),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Detailed time analysis retrieved successfully",
		"data": fiber.Map{
			"date":        analysisDate.Format("2006-01-02"),
			"hourly_data": hourlyData,
		},
		"filters": fiber.Map{
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
}

// Get sales comparison between different time periods
func GetSalesComparison(c *fiber.Ctx) error {
	db := database.DB

	// Get parameters
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")
	startDateStr := c.Query("start_date", "")
	endDateStr := c.Query("end_date", "")

	// Default to last 7 days if no dates provided
	var startDate, endDate time.Time
	if startDateStr != "" && endDateStr != "" {
		var err error
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid start_date format. Use YYYY-MM-DD",
			})
		}
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid end_date format. Use YYYY-MM-DD",
			})
		}
	} else {
		endDate = time.Now()
		startDate = endDate.AddDate(0, 0, -7) // Last 7 days
	}

	// Ensure end date includes the full day
	endDate = time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())

	var dailyComparison []map[string]interface{}

	// Get data for each day in the range
	for d := startDate; !d.After(endDate.Truncate(24 * time.Hour)); d = d.AddDate(0, 0, 1) {
		dayStart := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, d.Location())
		dayEnd := dayStart.Add(24 * time.Hour)

		// Get key time slots for this day
		timeSlots := getTimeSlotSummary(db, dayStart, dayEnd, countryUUID, provinceUUID)

		// Get total for the day
		query := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", dayStart, dayEnd)

		if countryUUID != "" {
			query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
				Where("provinces.country_uuid = ?", countryUUID)
		}

		if provinceUUID != "" {
			query = query.Where("province_uuid = ?", provinceUUID)
		}

		var dailyCount, dailyQuantity int64
		query.Count(&dailyCount)
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&dailyQuantity)

		dailyComparison = append(dailyComparison, map[string]interface{}{
			"date":           d.Format("2006-01-02"),
			"day_name":       d.Format("Monday"),
			"total_sales":    dailyCount,
			"total_quantity": dailyQuantity,
			"time_slots":     timeSlots,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Sales comparison retrieved successfully",
		"data": fiber.Map{
			"period": fiber.Map{
				"start_date": startDate.Format("2006-01-02"),
				"end_date":   endDate.Format("2006-01-02"),
			},
			"daily_comparison": dailyComparison,
		},
		"filters": fiber.Map{
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
}

// Helper function to get period name
func getPeriodName(hour int) string {
	switch {
	case hour >= 0 && hour < 6:
		return "Night"
	case hour >= 6 && hour < 12:
		return "Morning"
	case hour >= 12 && hour < 18:
		return "Afternoon"
	default:
		return "Evening"
	}
}

// Get real-time dashboard updates (for live refresh)
func GetRealTimeDashboard(c *fiber.Ctx) error {
	db := database.DB

	// Get parameters
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")

	now := time.Now()
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// Get current hour slot
	currentHour := now.Hour()
	var currentSlotStart, currentSlotEnd time.Time

	// Determine which key time slot we're in or approaching
	if currentHour < 12 {
		// Before 12pm - show countdown to 12pm slot
		currentSlotStart = time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, now.Location())
		currentSlotEnd = currentSlotStart.Add(1 * time.Hour)
	} else if currentHour < 15 {
		// Between 12pm-3pm or in 12pm slot
		currentSlotStart = time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, now.Location())
		currentSlotEnd = currentSlotStart.Add(1 * time.Hour)
	} else if currentHour < 20 {
		// Between 3pm-8pm or in 3pm slot
		currentSlotStart = time.Date(now.Year(), now.Month(), now.Day(), 15, 0, 0, 0, now.Location())
		currentSlotEnd = currentSlotStart.Add(1 * time.Hour)
	} else {
		// 8pm or later
		currentSlotStart = time.Date(now.Year(), now.Month(), now.Day(), 20, 0, 0, 0, now.Location())
		currentSlotEnd = currentSlotStart.Add(1 * time.Hour)
	}

	// Get sales in current time slot
	query := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", currentSlotStart, currentSlotEnd)

	if countryUUID != "" {
		query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("province_uuid = ?", provinceUUID)
	}

	var currentSlotSales, currentSlotQuantity int64
	query.Count(&currentSlotSales)
	query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&currentSlotQuantity)

	// Get today's total so far
	todayQuery := db.Model(&models.Sale{}).Where("created_at >= ?", startOfToday)

	if countryUUID != "" {
		todayQuery = todayQuery.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		todayQuery = todayQuery.Where("province_uuid = ?", provinceUUID)
	}

	var todayTotal, todayQuantityTotal int64
	todayQuery.Count(&todayTotal)
	todayQuery.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&todayQuantityTotal)

	// Get last 5 sales for live feed
	recentSales := getRecentSales(db, countryUUID, provinceUUID, 5)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Real-time dashboard data retrieved",
		"data": fiber.Map{
			"current_time": now.Format("15:04:05"),
			"current_date": now.Format("2006-01-02"),
			"current_slot": fiber.Map{
				"start_time":     currentSlotStart.Format("15:04"),
				"end_time":       currentSlotEnd.Format("15:04"),
				"sales_count":    currentSlotSales,
				"total_quantity": currentSlotQuantity,
				"is_active":      now.After(currentSlotStart) && now.Before(currentSlotEnd),
			},
			"today_total": fiber.Map{
				"sales_count":    todayTotal,
				"total_quantity": todayQuantityTotal,
			},
			"recent_sales": recentSales,
			"next_update":  now.Add(5 * time.Minute).Format("15:04:05"), // Suggest 5-minute updates
		},
		"filters": fiber.Map{
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
}

// Get filter options for dashboard (countries and provinces)
func GetDashboardFilters(c *fiber.Ctx) error {
	db := database.DB

	// Get all countries that have sales
	var countries []models.Country
	db.Distinct().
		Joins("JOIN provinces ON countries.uuid = provinces.country_uuid").
		Joins("JOIN sales ON provinces.uuid = sales.province_uuid").
		Find(&countries)

	// Get all provinces that have sales
	var provinces []models.Province
	db.Preload("Country").
		Joins("JOIN sales ON provinces.uuid = sales.province_uuid").
		Distinct().
		Find(&provinces)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Dashboard filters retrieved successfully",
		"data": fiber.Map{
			"countries": countries,
			"provinces": provinces,
		},
	})
}

// Get manager team overview - shows all team members and their performance
func GetManagerTeamOverview(c *fiber.Ctx) error {
	db := database.DB

	// Get parameters
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")
	dateStr := c.Query("date", "")

	// Parse date or use today
	var analysisDate time.Time
	if dateStr != "" {
		var err error
		analysisDate, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid date format. Use YYYY-MM-DD",
			})
		}
	} else {
		analysisDate = time.Now()
	}

	startOfDay := time.Date(analysisDate.Year(), analysisDate.Month(), analysisDate.Day(), 0, 0, 0, 0, analysisDate.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Get all team members with sales activity
	teamQuery := db.Model(&models.User{})

	if countryUUID != "" {
		teamQuery = teamQuery.Where("country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		teamQuery = teamQuery.Where("province_uuid = ?", provinceUUID)
	}

	var teamMembers []models.User
	teamQuery.Preload("Country").Preload("Province").Find(&teamMembers)

	// Get performance data for each team member
	var teamOverview []map[string]interface{}

	for _, member := range teamMembers {
		// Get sales count and quantity for this member on the specified date
		var salesCount, totalQuantity int64
		var lastSaleTime *time.Time

		salesQuery := db.Model(&models.Sale{}).
			Where("user_uuid = ? AND created_at >= ? AND created_at < ?", member.UUID, startOfDay, endOfDay)

		salesQuery.Count(&salesCount)
		salesQuery.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&totalQuantity)

		// Get last sale time for this member
		var lastSale models.Sale
		db.Where("user_uuid = ?", member.UUID).
			Order("created_at DESC").
			First(&lastSale)

		if lastSale.UUID != "" {
			lastSaleTime = &lastSale.CreatedAt
		}

		// Get time slot performance for this member
		memberTimeSlots := getMemberTimeSlotPerformance(db, member.UUID, startOfDay, endOfDay)

		teamOverview = append(teamOverview, map[string]interface{}{
			"user_uuid":             member.UUID,
			"user_name":             member.Fullname,
			"user_title":            member.Title,
			"user_email":            member.Email,
			"user_phone":            member.Phone,
			"country":               member.Country,
			"province":              member.Province,
			"sales_count":           salesCount,
			"total_quantity":        totalQuantity,
			"last_sale_time":        lastSaleTime,
			"time_slot_performance": memberTimeSlots,
			"status":                getPerformanceStatus(salesCount),
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Team overview retrieved successfully",
		"data": fiber.Map{
			"date":          analysisDate.Format("2006-01-02"),
			"team_members":  teamOverview,
			"total_members": len(teamMembers),
		},
		"filters": fiber.Map{
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
}

// Helper function to get time slot performance for a specific team member
func getMemberTimeSlotPerformance(db *gorm.DB, userUUID string, startOfDay, endOfDay time.Time) []map[string]interface{} {
	timeSlots := []int{12, 15, 20} // 12pm, 3pm, 8pm
	var performance []map[string]interface{}

	for _, hour := range timeSlots {
		slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), hour, 0, 0, 0, startOfDay.Location())
		slotEnd := slotStart.Add(1 * time.Hour)

		var count, quantity int64
		db.Model(&models.Sale{}).
			Where("user_uuid = ? AND created_at >= ? AND created_at < ?", userUUID, slotStart, slotEnd).
			Count(&count)

		db.Model(&models.Sale{}).
			Where("user_uuid = ? AND created_at >= ? AND created_at < ?", userUUID, slotStart, slotEnd).
			Select("COALESCE(SUM(quantity), 0)").
			Row().Scan(&quantity)

		var timeSlotName string
		switch hour {
		case 12:
			timeSlotName = "12:00 PM - 1:00 PM"
		case 15:
			timeSlotName = "3:00 PM - 4:00 PM"
		case 20:
			timeSlotName = "8:00 PM - 9:00 PM"
		}

		performance = append(performance, map[string]interface{}{
			"time_slot":      timeSlotName,
			"hour":           hour,
			"sales_count":    count,
			"total_quantity": quantity,
		})
	}

	return performance
}

// Helper function to determine performance status based on sales count
func getPerformanceStatus(salesCount int64) string {
	switch {
	case salesCount == 0:
		return "No Activity"
	case salesCount >= 1 && salesCount <= 3:
		return "Low Activity"
	case salesCount >= 4 && salesCount <= 7:
		return "Moderate Activity"
	case salesCount >= 8 && salesCount <= 15:
		return "High Activity"
	default:
		return "Exceptional Activity"
	}
}
