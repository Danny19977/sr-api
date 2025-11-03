package dashboard

import (
	"strconv"
	"strings"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

type DailyMonitorResponse struct {
	TotalSalesToday      int64                 `json:"total_sales_today"`
	TargetForToday       int64                 `json:"target_for_today"`    // Added: Target from Week table
	AchievementPercent   float64               `json:"achievement_percent"` // Added: % of target achieved
	PaceVsYesterday      float64               `json:"pace_vs_yesterday"`   // Percentage comparison
	LastEntryStatus      []ProvinceEntryStatus `json:"last_entry_status"`
	CumulativeSalesChart CumulativeSalesData   `json:"cumulative_sales_chart"`
	DailyEntryTable      []DailyEntryRow       `json:"daily_entry_table"`
	ProvinceBarChart     []ProvinceBarData     `json:"province_bar_chart"`  // Bar chart: Sales by province
	TimeSlotBarChart     []TimeSlotBarData     `json:"time_slot_bar_chart"` // Bar chart: Sales by time slot
	ProvincePieChart     []ProvincePieData     `json:"province_pie_chart"`  // Pie chart: Province contribution
	TimeSlotPieChart     []TimeSlotPieData     `json:"time_slot_pie_chart"` // Pie chart: Time slot distribution
}

type ProvinceBarData struct {
	ProvinceUUID string `json:"province_uuid"`
	ProvinceName string `json:"province_name"`
	TotalSales   int64  `json:"total_sales"`
}

type TimeSlotBarData struct {
	TimeSlot   string `json:"time_slot"` // "8am", "12pm", "3pm", "8pm"
	TotalSales int64  `json:"total_sales"`
}

type ProvincePieData struct {
	ProvinceUUID string  `json:"province_uuid"`
	ProvinceName string  `json:"province_name"`
	Sales        int64   `json:"sales"`
	Percentage   float64 `json:"percentage"`
}

type TimeSlotPieData struct {
	TimeSlot   string  `json:"time_slot"`
	Sales      int64   `json:"sales"`
	Percentage float64 `json:"percentage"`
}

type ProvinceEntryStatus struct {
	ProvinceUUID     string    `json:"province_uuid"`
	ProvinceName     string    `json:"province_name"`
	LastEntryTime    string    `json:"last_entry_time"`   // "8am", "12pm", "3pm", "8pm"
	LastEntryAt      time.Time `json:"last_entry_at"`     // Actual timestamp
	MissingEntries   []string  `json:"missing_entries"`   // List of missing time slots
	ComplianceStatus string    `json:"compliance_status"` // "complete", "partial", "missing"
}

type CumulativeSalesData struct {
	TimeSlots      []string `json:"time_slots"`      // ["8am", "12pm", "3pm", "8pm"]
	TodaySales     []int64  `json:"today_sales"`     // Cumulative for today
	YesterdaySales []int64  `json:"yesterday_sales"` // Cumulative for yesterday
	AverageSales   []int64  `json:"average_sales"`   // Cumulative average (last 7 days)
}

type DailyEntryRow struct {
	ProvinceUUID string `json:"province_uuid"`
	ProvinceName string `json:"province_name"`
	Entry8am     int64  `json:"entry_8am"`
	Entry12pm    int64  `json:"entry_12pm"`
	Entry3pm     int64  `json:"entry_3pm"`
	Entry8pm     int64  `json:"entry_8pm"`
	DailyTotal   int64  `json:"daily_total"`
}

// GetDailyMonitor handles the daily operations monitor dashboard data retrieval
func GetDailyMonitor(c *fiber.Ctx) error {
	// Parse date from query parameter (defaults to today)
	dateParam := c.Query("date")
	provincesParam := c.Query("provinces")     // Comma-separated list
	singleProvince := c.Query("province_uuid") // Single province for compatibility

	var selectedDate time.Time
	if dateParam == "" {
		// Default to today
		selectedDate = time.Now()
	} else {
		var err error
		selectedDate, err = time.Parse("2006-01-02", dateParam)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": "Invalid date format. Use YYYY-MM-DD",
				"error":   err.Error(),
			})
		}
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
	// Fallback to single province
	if len(provinceUUIDs) == 0 && singleProvince != "" {
		singleProvince = strings.TrimSpace(singleProvince)
		if singleProvince != "" {
			provinceUUIDs = []string{singleProvince}
		}
	}

	// Get all the required data
	response, err := getDailyMonitorData(selectedDate, provinceUUIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Error fetching daily monitor data",
			"error":   err.Error(),
		})
	}

	return c.JSON(response)
}

func getDailyMonitorData(selectedDate time.Time, provinceUUIDs []string) (DailyMonitorResponse, error) {
	// Normalize to start of day
	startOfDay := time.Date(selectedDate.Year(), selectedDate.Month(), selectedDate.Day(), 0, 0, 0, 0, selectedDate.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	// Get today's total sales
	totalSalesToday, err := getTotalSalesForDay(startOfDay, endOfDay, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get target for today from Week table
	_, weekNum := selectedDate.ISOWeek()
	targetForToday, err := getDailyTargetFromWeek(selectedDate.Year(), weekNum, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Calculate achievement percentage
	var achievementPercent float64
	if targetForToday > 0 {
		achievementPercent = float64(totalSalesToday) / float64(targetForToday) * 100
	}

	// Get pace vs yesterday
	paceVsYesterday, err := getPaceVsYesterday(selectedDate, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get last entry status for each province
	lastEntryStatus, err := getLastEntryStatus(startOfDay, endOfDay, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get cumulative sales chart data
	cumulativeSalesChart, err := getCumulativeSalesChart(selectedDate, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get daily entry table data
	dailyEntryTable, err := getDailyEntryTable(startOfDay, endOfDay, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get province bar chart data (today's sales by province)
	provinceBarChart, err := getProvinceBarChart(startOfDay, endOfDay, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get time slot bar chart data (today's sales by time slot)
	timeSlotBarChart, err := getTimeSlotBarChart(startOfDay, endOfDay, provinceUUIDs)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get province pie chart data (province contribution %)
	provincePieChart, err := getProvincePieChart(startOfDay, endOfDay, provinceUUIDs, totalSalesToday)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	// Get time slot pie chart data (time slot distribution %)
	timeSlotPieChart, err := getTimeSlotPieChart(startOfDay, endOfDay, provinceUUIDs, totalSalesToday)
	if err != nil {
		return DailyMonitorResponse{}, err
	}

	return DailyMonitorResponse{
		TotalSalesToday:      totalSalesToday,
		TargetForToday:       targetForToday,
		AchievementPercent:   achievementPercent,
		PaceVsYesterday:      paceVsYesterday,
		LastEntryStatus:      lastEntryStatus,
		CumulativeSalesChart: cumulativeSalesChart,
		DailyEntryTable:      dailyEntryTable,
		ProvinceBarChart:     provinceBarChart,
		TimeSlotBarChart:     timeSlotBarChart,
		ProvincePieChart:     provincePieChart,
		TimeSlotPieChart:     timeSlotPieChart,
	}, nil
}

// getTotalSalesForDay returns total sales for the specified day
func getTotalSalesForDay(startOfDay, endOfDay time.Time, provinceUUIDs []string) (int64, error) {
	db := database.DB
	query := db.Model(&models.Sale{}).
		Where("created_at BETWEEN ? AND ?", startOfDay, endOfDay)

	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}

	var total int64
	err := query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&total)
	return total, err
}

// getPaceVsYesterday calculates the pace comparison with yesterday at the same time
func getPaceVsYesterday(selectedDate time.Time, provinceUUIDs []string) (float64, error) {
	db := database.DB
	now := time.Now()

	// Only compare pace if looking at today
	if selectedDate.Year() != now.Year() || selectedDate.YearDay() != now.YearDay() {
		// For historical dates, compare full day totals
		startOfSelectedDay := time.Date(selectedDate.Year(), selectedDate.Month(), selectedDate.Day(), 0, 0, 0, 0, selectedDate.Location())
		endOfSelectedDay := startOfSelectedDay.Add(24 * time.Hour)

		yesterday := selectedDate.AddDate(0, 0, -1)
		startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
		endOfYesterday := startOfYesterday.Add(24 * time.Hour)

		todayTotal, _ := getTotalSalesForDay(startOfSelectedDay, endOfSelectedDay, provinceUUIDs)
		yesterdayTotal, _ := getTotalSalesForDay(startOfYesterday, endOfYesterday, provinceUUIDs)

		if yesterdayTotal == 0 {
			return 0, nil
		}
		return float64(todayTotal-yesterdayTotal) / float64(yesterdayTotal) * 100, nil
	}

	// For today: compare up to current time
	startOfToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	yesterday := now.AddDate(0, 0, -1)
	startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
	yesterdaySameTime := startOfYesterday.Add(time.Duration(now.Hour())*time.Hour + time.Duration(now.Minute())*time.Minute)

	// Today's sales so far
	query := db.Model(&models.Sale{}).
		Where("created_at BETWEEN ? AND ?", startOfToday, now)
	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}
	var todaySoFar int64
	query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&todaySoFar)

	// Yesterday at the same time
	queryYesterday := db.Model(&models.Sale{}).
		Where("created_at BETWEEN ? AND ?", startOfYesterday, yesterdaySameTime)
	if len(provinceUUIDs) > 0 {
		queryYesterday = queryYesterday.Where("province_uuid IN ?", provinceUUIDs)
	}
	var yesterdaySameTimeSales int64
	queryYesterday.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&yesterdaySameTimeSales)

	if yesterdaySameTimeSales == 0 {
		return 0, nil
	}

	return float64(todaySoFar-yesterdaySameTimeSales) / float64(yesterdaySameTimeSales) * 100, nil
}

// getLastEntryStatus returns the last entry status for each province
func getLastEntryStatus(startOfDay, endOfDay time.Time, provinceUUIDs []string) ([]ProvinceEntryStatus, error) {
	db := database.DB
	var result []ProvinceEntryStatus

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Time slots in order
	timeSlots := []struct {
		name      string
		startHour int
		endHour   int
	}{
		{"8am", 6, 10},
		{"12pm", 10, 14},
		{"3pm", 14, 18},
		{"8pm", 18, 22},
	}

	for _, province := range provinces {
		status := ProvinceEntryStatus{
			ProvinceUUID:   province.UUID,
			ProvinceName:   province.Name,
			MissingEntries: []string{},
		}

		var lastEntry time.Time
		var lastSlot string

		// Check each time slot
		for _, slot := range timeSlots {
			slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.startHour, 0, 0, 0, startOfDay.Location())
			slotEnd := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.endHour, 0, 0, 0, startOfDay.Location())

			var count int64
			err := db.Model(&models.Sale{}).
				Where("province_uuid = ? AND created_at BETWEEN ? AND ?", province.UUID, slotStart, slotEnd).
				Count(&count).Error
			if err != nil {
				return nil, err
			}

			if count > 0 {
				// Get the latest entry in this slot
				var latestEntry models.Sale
				db.Model(&models.Sale{}).
					Where("province_uuid = ? AND created_at BETWEEN ? AND ?", province.UUID, slotStart, slotEnd).
					Order("created_at DESC").
					First(&latestEntry)

				if latestEntry.CreatedAt.After(lastEntry) {
					lastEntry = latestEntry.CreatedAt
					lastSlot = slot.name
				}
			} else {
				// Only mark as missing if the time has passed
				if time.Now().After(slotEnd) {
					status.MissingEntries = append(status.MissingEntries, slot.name)
				}
			}
		}

		status.LastEntryTime = lastSlot
		status.LastEntryAt = lastEntry

		// Determine compliance status
		if len(status.MissingEntries) == 0 && lastSlot != "" {
			status.ComplianceStatus = "complete"
		} else if lastSlot != "" {
			status.ComplianceStatus = "partial"
		} else {
			status.ComplianceStatus = "missing"
		}

		result = append(result, status)
	}

	return result, nil
}

// getCumulativeSalesChart returns cumulative sales data for today, yesterday, and 7-day average
func getCumulativeSalesChart(selectedDate time.Time, provinceUUIDs []string) (CumulativeSalesData, error) {
	db := database.DB

	timeSlots := []string{"8am", "12pm", "3pm", "8pm"}
	slotHours := map[string][]int{
		"8am":  {6, 10},
		"12pm": {10, 14},
		"3pm":  {14, 18},
		"8pm":  {18, 22},
	}

	startOfDay := time.Date(selectedDate.Year(), selectedDate.Month(), selectedDate.Day(), 0, 0, 0, 0, selectedDate.Location())

	// Get today's cumulative sales
	todaySales := make([]int64, 4)
	var cumulative int64
	for i, slot := range timeSlots {
		hours := slotHours[slot]
		slotEnd := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), hours[1], 0, 0, 0, startOfDay.Location())

		query := db.Model(&models.Sale{}).
			Where("created_at BETWEEN ? AND ?", startOfDay, slotEnd)
		if len(provinceUUIDs) > 0 {
			query = query.Where("province_uuid IN ?", provinceUUIDs)
		}

		var total int64
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&total)
		cumulative = total
		todaySales[i] = cumulative
	}

	// Get yesterday's cumulative sales
	yesterday := selectedDate.AddDate(0, 0, -1)
	startOfYesterday := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
	yesterdaySales := make([]int64, 4)
	cumulative = 0
	for i, slot := range timeSlots {
		hours := slotHours[slot]
		slotEnd := time.Date(startOfYesterday.Year(), startOfYesterday.Month(), startOfYesterday.Day(), hours[1], 0, 0, 0, startOfYesterday.Location())

		query := db.Model(&models.Sale{}).
			Where("created_at BETWEEN ? AND ?", startOfYesterday, slotEnd)
		if len(provinceUUIDs) > 0 {
			query = query.Where("province_uuid IN ?", provinceUUIDs)
		}

		var total int64
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&total)
		cumulative = total
		yesterdaySales[i] = cumulative
	}

	// Get 7-day average cumulative sales
	averageSales := make([]int64, 4)
	for i, slot := range timeSlots {
		hours := slotHours[slot]
		var total int64 = 0

		// Sum across last 7 days
		for d := 1; d <= 7; d++ {
			pastDay := selectedDate.AddDate(0, 0, -d)
			startOfPastDay := time.Date(pastDay.Year(), pastDay.Month(), pastDay.Day(), 0, 0, 0, 0, pastDay.Location())
			slotEnd := time.Date(startOfPastDay.Year(), startOfPastDay.Month(), startOfPastDay.Day(), hours[1], 0, 0, 0, startOfPastDay.Location())

			query := db.Model(&models.Sale{}).
				Where("created_at BETWEEN ? AND ?", startOfPastDay, slotEnd)
			if len(provinceUUIDs) > 0 {
				query = query.Where("province_uuid IN ?", provinceUUIDs)
			}

			var dayTotal int64
			query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&dayTotal)
			total += dayTotal
		}

		averageSales[i] = total / 7
	}

	return CumulativeSalesData{
		TimeSlots:      timeSlots,
		TodaySales:     todaySales,
		YesterdaySales: yesterdaySales,
		AverageSales:   averageSales,
	}, nil
}

// getDailyEntryTable returns the raw entry data for each province by time slot
func getDailyEntryTable(startOfDay, endOfDay time.Time, provinceUUIDs []string) ([]DailyEntryRow, error) {
	db := database.DB
	var result []DailyEntryRow

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Time slots
	timeSlots := map[string][]int{
		"8am":  {6, 10},
		"12pm": {10, 14},
		"3pm":  {14, 18},
		"8pm":  {18, 22},
	}

	for _, province := range provinces {
		row := DailyEntryRow{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
		}

		// Get sales for each time slot
		for slotName, hours := range timeSlots {
			slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), hours[0], 0, 0, 0, startOfDay.Location())
			slotEnd := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), hours[1], 0, 0, 0, startOfDay.Location())

			var sales int64
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND created_at BETWEEN ? AND ?", province.UUID, slotStart, slotEnd).
				Select("COALESCE(SUM(quantity), 0)").
				Row().
				Scan(&sales)

			switch slotName {
			case "8am":
				row.Entry8am = sales
			case "12pm":
				row.Entry12pm = sales
			case "3pm":
				row.Entry3pm = sales
			case "8pm":
				row.Entry8pm = sales
			}
		}

		// Calculate daily total
		row.DailyTotal = row.Entry8am + row.Entry12pm + row.Entry3pm + row.Entry8pm

		result = append(result, row)
	}

	return result, nil
}

// getProvinceBarChart returns sales by province for bar chart visualization
func getProvinceBarChart(startOfDay, endOfDay time.Time, provinceUUIDs []string) ([]ProvinceBarData, error) {
	db := database.DB
	var result []ProvinceBarData

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Get sales for each province
	for _, province := range provinces {
		var totalSales int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?", province.UUID, startOfDay, endOfDay).
			Select("COALESCE(SUM(quantity), 0)").
			Row().
			Scan(&totalSales)

		result = append(result, ProvinceBarData{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			TotalSales:   totalSales,
		})
	}

	return result, nil
}

// getTimeSlotBarChart returns sales by time slot for bar chart visualization
func getTimeSlotBarChart(startOfDay, endOfDay time.Time, provinceUUIDs []string) ([]TimeSlotBarData, error) {
	db := database.DB
	var result []TimeSlotBarData

	// Time slots
	timeSlots := []struct {
		name  string
		hours []int
	}{
		{"8am", []int{6, 10}},
		{"12pm", []int{10, 14}},
		{"3pm", []int{14, 18}},
		{"8pm", []int{18, 22}},
	}

	// Get sales for each time slot
	for _, slot := range timeSlots {
		slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.hours[0], 0, 0, 0, startOfDay.Location())
		slotEnd := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.hours[1], 0, 0, 0, startOfDay.Location())

		query := db.Model(&models.Sale{}).
			Where("created_at BETWEEN ? AND ?", slotStart, slotEnd)

		if len(provinceUUIDs) > 0 {
			query = query.Where("province_uuid IN ?", provinceUUIDs)
		}

		var totalSales int64
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&totalSales)

		result = append(result, TimeSlotBarData{
			TimeSlot:   slot.name,
			TotalSales: totalSales,
		})
	}

	return result, nil
}

// getProvincePieChart returns province contribution percentages for pie chart
func getProvincePieChart(startOfDay, endOfDay time.Time, provinceUUIDs []string, totalSales int64) ([]ProvincePieData, error) {
	db := database.DB
	var result []ProvincePieData

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// Get sales for each province with percentage
	for _, province := range provinces {
		var provinceSales int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?", province.UUID, startOfDay, endOfDay).
			Select("COALESCE(SUM(quantity), 0)").
			Row().
			Scan(&provinceSales)

		var percentage float64
		if totalSales > 0 {
			percentage = float64(provinceSales) / float64(totalSales) * 100
		}

		result = append(result, ProvincePieData{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			Sales:        provinceSales,
			Percentage:   percentage,
		})
	}

	return result, nil
}

// getTimeSlotPieChart returns time slot distribution percentages for pie chart
func getTimeSlotPieChart(startOfDay, endOfDay time.Time, provinceUUIDs []string, totalSales int64) ([]TimeSlotPieData, error) {
	db := database.DB
	var result []TimeSlotPieData

	// Time slots
	timeSlots := []struct {
		name  string
		hours []int
	}{
		{"8am", []int{6, 10}},
		{"12pm", []int{10, 14}},
		{"3pm", []int{14, 18}},
		{"8pm", []int{18, 22}},
	}

	// Get sales for each time slot with percentage
	for _, slot := range timeSlots {
		slotStart := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.hours[0], 0, 0, 0, startOfDay.Location())
		slotEnd := time.Date(startOfDay.Year(), startOfDay.Month(), startOfDay.Day(), slot.hours[1], 0, 0, 0, startOfDay.Location())

		query := db.Model(&models.Sale{}).
			Where("created_at BETWEEN ? AND ?", slotStart, slotEnd)

		if len(provinceUUIDs) > 0 {
			query = query.Where("province_uuid IN ?", provinceUUIDs)
		}

		var slotSales int64
		query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&slotSales)

		var percentage float64
		if totalSales > 0 {
			percentage = float64(slotSales) / float64(totalSales) * 100
		}

		result = append(result, TimeSlotPieData{
			TimeSlot:   slot.name,
			Sales:      slotSales,
			Percentage: percentage,
		})
	}

	return result, nil
}

// getDailyTargetFromWeek calculates the daily target from weekly targets
// Weekly target is divided by 7 to get daily target, then aggregated for all filtered provinces
func getDailyTargetFromWeek(year int, weekNum int, provinceUUIDs []string) (int64, error) {
	db := database.DB

	// Get year record
	yearStr := strconv.Itoa(year)
	var yearRecord models.Year
	err := db.Model(&models.Year{}).
		Where("year = ?", yearStr).
		First(&yearRecord).Error

	if err != nil {
		return 0, nil // No year record, no target
	}

	weekStr := strconv.Itoa(weekNum)

	// Build query for week records
	query := db.Model(&models.Week{}).
		Where("week = ? AND year_uuid = ?", weekStr, yearRecord.UUID)

	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}

	var weekRecords []models.Week
	err = query.Find(&weekRecords).Error
	if err != nil {
		return 0, nil
	}

	// Aggregate weekly targets and divide by 7 for daily target
	var totalDailyTarget int64
	for _, weekRecord := range weekRecords {
		weeklyTarget, err := strconv.ParseInt(weekRecord.Quantity, 10, 64)
		if err != nil {
			continue
		}
		// Divide weekly target by 7 to get daily target
		dailyTarget := weeklyTarget / 7
		totalDailyTarget += dailyTarget
	}

	return totalDailyTarget, nil
}
