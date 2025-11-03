package dashboard

import (
	"strconv"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
)

// TargetData represents aggregated target information
type TargetData struct {
	ProvinceUUID string
	Target       int64
	Period       string // For identification (year, month, week)
}

// getYearlyTargets fetches yearly targets for provinces within a year
func getYearlyTargets(year int, provinceUUIDs []string) (map[string]int64, error) {
	db := database.DB
	targets := make(map[string]int64)

	yearStr := strconv.Itoa(year)

	// Query Year table to get the yearly target
	var yearRecord models.Year
	err := db.Model(&models.Year{}).
		Where("year = ?", yearStr).
		First(&yearRecord).Error

	if err != nil {
		// No yearly target found, return empty map
		return targets, nil
	}

	// Convert quantity string to int64
	yearlyTarget, err := strconv.ParseInt(yearRecord.Quantity, 10, 64)
	if err != nil {
		return targets, err
	}

	// If no province filter, return the global yearly target for all provinces
	if len(provinceUUIDs) == 0 {
		// Get all provinces and distribute target
		var provinces []models.Province
		if err := db.Find(&provinces).Error; err != nil {
			return targets, err
		}

		// Distribute yearly target equally among provinces (or use another strategy)
		targetPerProvince := yearlyTarget / int64(len(provinces))
		for _, province := range provinces {
			targets[province.UUID] = targetPerProvince
		}
	} else {
		// Distribute target among filtered provinces
		targetPerProvince := yearlyTarget / int64(len(provinceUUIDs))
		for _, uuid := range provinceUUIDs {
			targets[uuid] = targetPerProvince
		}
	}

	return targets, nil
}

// getMonthlyTargets fetches monthly targets for provinces within a date range
func getMonthlyTargets(dateRange DateRange, provinceUUIDs []string) (map[string]int64, error) {
	db := database.DB
	targets := make(map[string]int64)

	// Extract year and months from date range
	startYear := dateRange.StartDate.Year()
	endYear := dateRange.EndDate.Year()
	startMonth := int(dateRange.StartDate.Month())
	endMonth := int(dateRange.EndDate.Month())

	// Get all months within the date range
	monthNames := []string{"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"}

	// Build query for month records
	query := db.Model(&models.Month{})

	// Add province filter if provided
	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}

	var monthRecords []models.Month
	err := query.Find(&monthRecords).Error
	if err != nil {
		return targets, err
	}

	// Aggregate targets by province
	for _, monthRecord := range monthRecords {
		// Parse month name to check if it's in our date range
		monthIndex := -1
		for i, name := range monthNames {
			if monthRecord.Month == name {
				monthIndex = i + 1
				break
			}
		}

		if monthIndex == -1 {
			continue
		}

		// Check if this month falls within our date range
		// This is a simplified check - you may need more sophisticated logic
		if startYear == endYear {
			if monthIndex >= startMonth && monthIndex <= endMonth {
				quantity, err := strconv.ParseInt(monthRecord.Quantity, 10, 64)
				if err != nil {
					continue
				}
				targets[monthRecord.ProvinceUUID] += quantity
			}
		} else {
			// Handle multi-year ranges
			quantity, err := strconv.ParseInt(monthRecord.Quantity, 10, 64)
			if err != nil {
				continue
			}
			targets[monthRecord.ProvinceUUID] += quantity
		}
	}

	return targets, nil
}

// getWeeklyTargets fetches weekly targets for provinces within a date range
func getWeeklyTargets(dateRange DateRange, provinceUUIDs []string) (map[string]int64, error) {
	db := database.DB
	targets := make(map[string]int64)

	// Build query for week records
	query := db.Model(&models.Week{})

	// Add province filter if provided
	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}

	var weekRecords []models.Week
	err := query.Find(&weekRecords).Error
	if err != nil {
		return targets, err
	}

	// Aggregate targets by province
	// Note: You may want to filter by week number based on date range
	for _, weekRecord := range weekRecords {
		quantity, err := strconv.ParseInt(weekRecord.Quantity, 10, 64)
		if err != nil {
			continue
		}
		targets[weekRecord.ProvinceUUID] += quantity
	}

	return targets, nil
}

// getTargetsForDateRange fetches appropriate targets based on date range duration
// Automatically selects yearly, monthly, or weekly targets based on the time span
func getTargetsForDateRange(dateRange DateRange, provinceUUIDs []string) (map[string]int64, error) {
	duration := dateRange.EndDate.Sub(dateRange.StartDate)

	// For ranges > 90 days, use monthly targets
	if duration > 90*24*time.Hour {
		return getMonthlyTargets(dateRange, provinceUUIDs)
	}

	// For ranges > 31 days, use weekly targets
	if duration > 31*24*time.Hour {
		return getWeeklyTargets(dateRange, provinceUUIDs)
	}

	// For shorter ranges, use weekly targets
	return getWeeklyTargets(dateRange, provinceUUIDs)
}

// getMonthlyTargetByProvince fetches the target for a specific province and month
func getMonthlyTargetByProvince(provinceUUID string, year int, monthNum int) (int64, error) {
	db := database.DB

	monthNames := []string{"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"}

	if monthNum < 1 || monthNum > 12 {
		return 0, nil
	}

	monthName := monthNames[monthNum-1]

	// Get year record first
	yearStr := strconv.Itoa(year)
	var yearRecord models.Year
	err := db.Model(&models.Year{}).
		Where("year = ?", yearStr).
		First(&yearRecord).Error

	if err != nil {
		return 0, nil // No year record, no target
	}

	// Get month record
	var monthRecord models.Month
	err = db.Model(&models.Month{}).
		Where("province_uuid = ? AND month = ? AND year_uuid = ?",
			provinceUUID, monthName, yearRecord.UUID).
		First(&monthRecord).Error

	if err != nil {
		return 0, nil // No month target found
	}

	// Convert quantity string to int64
	target, err := strconv.ParseInt(monthRecord.Quantity, 10, 64)
	if err != nil {
		return 0, err
	}

	return target, nil
}

// getWeeklyTargetByProvince fetches the target for a specific province and week
func getWeeklyTargetByProvince(provinceUUID string, year int, weekNum int) (int64, error) {
	db := database.DB

	// Get year record first
	yearStr := strconv.Itoa(year)
	var yearRecord models.Year
	err := db.Model(&models.Year{}).
		Where("year = ?", yearStr).
		First(&yearRecord).Error

	if err != nil {
		return 0, nil
	}

	weekStr := strconv.Itoa(weekNum)

	// Get week record
	var weekRecord models.Week
	err = db.Model(&models.Week{}).
		Where("province_uuid = ? AND week = ? AND year_uuid = ?",
			provinceUUID, weekStr, yearRecord.UUID).
		First(&weekRecord).Error

	if err != nil {
		return 0, nil // No week target found
	}

	// Convert quantity string to int64
	target, err := strconv.ParseInt(weekRecord.Quantity, 10, 64)
	if err != nil {
		return 0, err
	}

	return target, nil
}

// getQuarterlyTargets fetches quarterly targets (sum of 3 months) for provinces
func getQuarterlyTargets(year int, quarter int, provinceUUIDs []string) (map[string]int64, error) {
	db := database.DB
	targets := make(map[string]int64)

	// Define quarter months
	quarterMonths := map[int][]int{
		1: {1, 2, 3},
		2: {4, 5, 6},
		3: {7, 8, 9},
		4: {10, 11, 12},
	}

	months := quarterMonths[quarter]
	monthNames := []string{"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"}

	// Get year record
	yearStr := strconv.Itoa(year)
	var yearRecord models.Year
	err := db.Model(&models.Year{}).
		Where("year = ?", yearStr).
		First(&yearRecord).Error

	if err != nil {
		return targets, nil
	}

	// Build query for the 3 months in the quarter
	query := db.Model(&models.Month{}).
		Where("year_uuid = ?", yearRecord.UUID)

	// Filter by provinces if provided
	if len(provinceUUIDs) > 0 {
		query = query.Where("province_uuid IN ?", provinceUUIDs)
	}

	// Filter by quarter months
	quarterMonthNames := []string{
		monthNames[months[0]-1],
		monthNames[months[1]-1],
		monthNames[months[2]-1],
	}
	query = query.Where("month IN ?", quarterMonthNames)

	var monthRecords []models.Month
	err = query.Find(&monthRecords).Error
	if err != nil {
		return targets, err
	}

	// Aggregate targets by province
	for _, monthRecord := range monthRecords {
		quantity, err := strconv.ParseInt(monthRecord.Quantity, 10, 64)
		if err != nil {
			continue
		}
		targets[monthRecord.ProvinceUUID] += quantity
	}

	return targets, nil
}
