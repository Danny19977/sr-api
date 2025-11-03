package dashboard

import (
	"fmt"
	"strings"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

type ProvincialAnalysisResponse struct {
	ProvincialComparison []ProvinceTimeSeries `json:"provincial_comparison"`
	ContributionData     []ContributionPoint  `json:"contribution_data"`
	IntraDayPattern      []IntraDayHeatmap    `json:"intraday_pattern"`
	TimeGranularity      string               `json:"time_granularity"`
	ProvinceTargets      []ProvinceTarget     `json:"province_targets"` // Added for target tracking
}

type ProvinceTarget struct {
	ProvinceUUID string  `json:"province_uuid"`
	ProvinceName string  `json:"province_name"`
	Target       int64   `json:"target"`
	Actual       int64   `json:"actual"`
	Achievement  float64 `json:"achievement"` // Percentage
}

type ProvinceTimeSeries struct {
	ProvinceUUID string      `json:"province_uuid"`
	ProvinceName string      `json:"province_name"`
	DataPoints   []TimePoint `json:"data_points"`
}

type TimePoint struct {
	Label string `json:"label"` // Date/Week/Month label
	Value int64  `json:"value"` // Sales value
}

type ContributionPoint struct {
	Label     string                 `json:"label"` // Time label
	Timestamp time.Time              `json:"timestamp"`
	Provinces []ProvinceContribution `json:"provinces"`
	Total     int64                  `json:"total"`
}

type ProvinceContribution struct {
	ProvinceUUID string  `json:"province_uuid"`
	ProvinceName string  `json:"province_name"`
	Sales        int64   `json:"sales"`
	Percentage   float64 `json:"percentage"`
}

type IntraDayHeatmap struct {
	ProvinceUUID string             `json:"province_uuid"`
	ProvinceName string             `json:"province_name"`
	TimeSlots    map[string]float64 `json:"time_slots"` // "8am", "12pm", "3pm", "8pm" -> average sales
}

// GetProvincialAnalysis handles the provincial analysis dashboard data retrieval
func GetProvincialAnalysis(c *fiber.Ctx) error {
	// Parse date range from query parameters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	provincesParam := c.Query("provinces")     // Comma-separated list of province UUIDs
	singleProvince := c.Query("province_uuid") // Optional single province for compatibility

	if startDate == "" || endDate == "" {
		// Default to current month if no date range provided
		now := time.Now()
		startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
		startDate = startOfMonth.Format("2006-01-02")
		endDate = now.Format("2006-01-02")
	}

	dateRange, err := parseDateRange(startDate, endDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid date range",
			"error":   err.Error(),
		})
	}

	// Parse province filter
	var provinceUUIDs []string
	if provincesParam != "" {
		parts := strings.Split(provincesParam, ",")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				provinceUUIDs = append(provinceUUIDs, p)
			}
		}
	}
	// Fallback: accept single province_uuid for compatibility with frontend
	if len(provinceUUIDs) == 0 && singleProvince != "" {
		singleProvince = strings.TrimSpace(singleProvince)
		if singleProvince != "" {
			provinceUUIDs = []string{singleProvince}
		}
	}

	// Get all the required data
	response, err := getProvincialAnalysisData(dateRange, provinceUUIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Error fetching provincial analysis data",
			"error":   err.Error(),
		})
	}

	return c.JSON(response)
}

func getProvincialAnalysisData(dateRange DateRange, provinceUUIDs []string) (ProvincialAnalysisResponse, error) {
	// Determine time granularity based on date range
	duration := dateRange.EndDate.Sub(dateRange.StartDate)
	timeGranularity := "daily"
	if duration > 90*24*time.Hour {
		timeGranularity = "monthly"
	} else if duration > 31*24*time.Hour {
		timeGranularity = "weekly"
	}

	// Get provincial comparison data (multi-line chart)
	provincialComparison, err := getProvincialComparison(dateRange, timeGranularity, provinceUUIDs)
	if err != nil {
		return ProvincialAnalysisResponse{}, err
	}

	// Get contribution data (stacked area chart)
	contributionData, err := getContributionData(dateRange, timeGranularity, provinceUUIDs)
	if err != nil {
		return ProvincialAnalysisResponse{}, err
	}

	// Get intra-day pattern data (heatmap)
	intraDayPattern, err := getIntraDayPattern(dateRange, provinceUUIDs)
	if err != nil {
		return ProvincialAnalysisResponse{}, err
	}

	// Get targets and calculate achievement
	provinceTargets, err := getProvinceTargetsWithAchievement(dateRange, provinceUUIDs)
	if err != nil {
		return ProvincialAnalysisResponse{}, err
	}

	return ProvincialAnalysisResponse{
		ProvincialComparison: provincialComparison,
		ContributionData:     contributionData,
		IntraDayPattern:      intraDayPattern,
		TimeGranularity:      timeGranularity,
		ProvinceTargets:      provinceTargets,
	}, nil
}

// getProvincialComparison returns time series data for each province
func getProvincialComparison(dateRange DateRange, granularity string, provinceUUIDs []string) ([]ProvinceTimeSeries, error) {
	db := database.DB
	var result []ProvinceTimeSeries

	// Get provinces based on filter
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// For each province, get time series data
	for _, province := range provinces {
		var dataPoints []TimePoint

		var query string
		var args []interface{}

		switch granularity {
		case "daily":
			query = `
				SELECT 
					TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as label,
					COALESCE(SUM(quantity), 0) as sales
				FROM sales 
				WHERE province_uuid = ? AND created_at BETWEEN ? AND ?
				GROUP BY DATE(created_at)
				ORDER BY DATE(created_at)
			`
			args = []interface{}{province.UUID, dateRange.StartDate, dateRange.EndDate}

		case "weekly":
			query = `
				SELECT 
					CONCAT('Week ', EXTRACT(WEEK FROM created_at)) as label,
					COALESCE(SUM(quantity), 0) as sales
				FROM sales 
				WHERE province_uuid = ? AND created_at BETWEEN ? AND ?
				GROUP BY EXTRACT(WEEK FROM created_at), EXTRACT(YEAR FROM created_at)
				ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(WEEK FROM created_at)
			`
			args = []interface{}{province.UUID, dateRange.StartDate, dateRange.EndDate}

		case "monthly":
			query = `
				SELECT 
					TO_CHAR(created_at, 'Mon YYYY') as label,
					COALESCE(SUM(quantity), 0) as sales
				FROM sales 
				WHERE province_uuid = ? AND created_at BETWEEN ? AND ?
				GROUP BY TO_CHAR(created_at, 'Mon YYYY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
				ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
			`
			args = []interface{}{province.UUID, dateRange.StartDate, dateRange.EndDate}
		}

		rows, err := db.Raw(query, args...).Rows()
		if err != nil {
			return nil, err
		}

		for rows.Next() {
			var label string
			var sales int64
			if err := rows.Scan(&label, &sales); err != nil {
				rows.Close()
				return nil, err
			}
			dataPoints = append(dataPoints, TimePoint{
				Label: label,
				Value: sales,
			})
		}
		rows.Close()

		result = append(result, ProvinceTimeSeries{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			DataPoints:   dataPoints,
		})
	}

	return result, nil
}

// getContributionData returns stacked area chart data showing each province's contribution over time
func getContributionData(dateRange DateRange, granularity string, provinceUUIDs []string) ([]ContributionPoint, error) {
	db := database.DB
	var result []ContributionPoint

	// Get provinces based on filter
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Create a map for quick province lookup
	provinceMap := make(map[string]string)
	for _, p := range provinces {
		provinceMap[p.UUID] = p.Name
	}

	// Build query based on granularity
	var query string
	var args []interface{}

	provinceFilter := ""
	if len(provinceUUIDs) > 0 {
		provinceFilter = "AND province_uuid IN ?"
	}

	switch granularity {
	case "daily":
		query = `
			SELECT 
				DATE(created_at) as date,
				province_uuid,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY DATE(created_at), province_uuid
			ORDER BY DATE(created_at), province_uuid
		`
		if len(provinceUUIDs) > 0 {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUIDs}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}

	case "weekly":
		query = `
			SELECT 
				DATE_TRUNC('week', created_at) as date,
				province_uuid,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY DATE_TRUNC('week', created_at), province_uuid
			ORDER BY DATE_TRUNC('week', created_at), province_uuid
		`
		if len(provinceUUIDs) > 0 {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUIDs}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}

	case "monthly":
		query = `
			SELECT 
				DATE_TRUNC('month', created_at) as date,
				province_uuid,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY DATE_TRUNC('month', created_at), province_uuid
			ORDER BY DATE_TRUNC('month', created_at), province_uuid
		`
		if len(provinceUUIDs) > 0 {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUIDs}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}
	}

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Group results by time period
	contributionMap := make(map[string]*ContributionPoint)
	for rows.Next() {
		var date time.Time
		var provinceUUID string
		var sales int64

		if err := rows.Scan(&date, &provinceUUID, &sales); err != nil {
			return nil, err
		}

		// Create label based on granularity
		var label string
		switch granularity {
		case "daily":
			label = date.Format("2006-01-02")
		case "weekly":
			label = fmt.Sprintf("Week %d", getWeekNumber(date))
		case "monthly":
			label = date.Format("Jan 2006")
		}

		// Get or create contribution point for this time period
		if contributionMap[label] == nil {
			contributionMap[label] = &ContributionPoint{
				Label:     label,
				Timestamp: date,
				Provinces: []ProvinceContribution{},
				Total:     0,
			}
		}

		contributionMap[label].Provinces = append(contributionMap[label].Provinces, ProvinceContribution{
			ProvinceUUID: provinceUUID,
			ProvinceName: provinceMap[provinceUUID],
			Sales:        sales,
		})
		contributionMap[label].Total += sales
	}

	// Calculate percentages and convert map to slice
	for _, point := range contributionMap {
		for i := range point.Provinces {
			if point.Total > 0 {
				point.Provinces[i].Percentage = float64(point.Provinces[i].Sales) / float64(point.Total) * 100
			}
		}
		result = append(result, *point)
	}

	// Sort by timestamp
	for i := 0; i < len(result); i++ {
		for j := i + 1; j < len(result); j++ {
			if result[i].Timestamp.After(result[j].Timestamp) {
				result[i], result[j] = result[j], result[i]
			}
		}
	}

	return result, nil
}

// getIntraDayPattern returns heatmap data showing average sales by time of day for each province
func getIntraDayPattern(dateRange DateRange, provinceUUIDs []string) ([]IntraDayHeatmap, error) {
	db := database.DB
	var result []IntraDayHeatmap

	// Get provinces based on filter
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Time slots: 8am (6-10), 12pm (10-14), 3pm (14-18), 8pm (18-22)
	timeSlots := map[string][]int{
		"8am":  {6, 10},
		"12pm": {10, 14},
		"3pm":  {14, 18},
		"8pm":  {18, 22},
	}

	for _, province := range provinces {
		heatmap := IntraDayHeatmap{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			TimeSlots:    make(map[string]float64),
		}

		// For each time slot, calculate average sales
		for slotName, hours := range timeSlots {
			var avgSales float64
			err := db.Raw(`
				SELECT COALESCE(AVG(quantity), 0)
				FROM sales
				WHERE province_uuid = ?
					AND created_at BETWEEN ? AND ?
					AND EXTRACT(HOUR FROM created_at) >= ?
					AND EXTRACT(HOUR FROM created_at) < ?
			`, province.UUID, dateRange.StartDate, dateRange.EndDate, hours[0], hours[1]).
				Row().
				Scan(&avgSales)

			if err != nil {
				return nil, err
			}

			heatmap.TimeSlots[slotName] = avgSales
		}

		result = append(result, heatmap)
	}

	return result, nil
}

// Helper function to get week number from date
func getWeekNumber(date time.Time) int {
	_, week := date.ISOWeek()
	return week
}

// getProvinceTargetsWithAchievement fetches targets and calculates achievement percentage
func getProvinceTargetsWithAchievement(dateRange DateRange, provinceUUIDs []string) ([]ProvinceTarget, error) {
	db := database.DB
	var result []ProvinceTarget

	// Get targets from Year/Month/Week tables
	targets, err := getTargetsForDateRange(dateRange, provinceUUIDs)
	if err != nil {
		return nil, err
	}

	// Get actual sales for each province
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	for _, province := range provinces {
		var actualSales int64
		err := db.Model(&models.Sale{}).
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?",
				province.UUID, dateRange.StartDate, dateRange.EndDate).
			Select("COALESCE(SUM(quantity), 0)").
			Row().
			Scan(&actualSales)

		if err != nil {
			continue
		}

		target := targets[province.UUID]
		var achievement float64
		if target > 0 {
			achievement = float64(actualSales) / float64(target) * 100
		}

		result = append(result, ProvinceTarget{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			Target:       target,
			Actual:       actualSales,
			Achievement:  achievement,
		})
	}

	return result, nil
}
