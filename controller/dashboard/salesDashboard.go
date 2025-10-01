package dashboard

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AreaSalesDashboard struct {
	Area       string  `json:"area"`
	Lundi      int64   `json:"lundi"`
	Mardi      int64   `json:"mardi"`
	Mercredi   int64   `json:"mercredi"`
	Jeudi      int64   `json:"jeudi"`
	Vendredi   int64   `json:"vendredi"`
	Samedi     int64   `json:"samedi"`
	TotalSold  int64   `json:"total_sold"`
	Previsions int64   `json:"previsions"`
	SoldVsPrev float64 `json:"sold_vs_prev"`
	MonthObj   int64   `json:"month_objectives"`
	ADS        float64 `json:"ads"`
	CurrentADS float64 `json:"current_ads"`
	ADSvsCADS  float64 `json:"ads_vs_cads"`
}

// GetAreaSalesDashboard aggregates sales data for dashboard
func GetAreaSalesDashboard(c *fiber.Ctx) error {
	db := database.DB

	// Get all provinces (areas)
	var provinces []models.Province
	if err := db.Find(&provinces).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch provinces"})
	}

	// For each province, aggregate sales by day (Lundi-Samedi)
	var dashboardData []AreaSalesDashboard
	days := []string{"Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"}
	for _, province := range provinces {
		area := province.Name
		salesByDay := make(map[string]int64)
		var totalSold int64 = 0
		for i, day := range days {
			var dayTotal int64
			// Query sales for this province and day (assuming CreatedAt.Weekday())
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND EXTRACT(DOW FROM created_at) = ?", province.UUID, (i+1)%7).
				Select("COALESCE(SUM(quantity),0)").
				Scan(&dayTotal)
			salesByDay[day] = dayTotal
			totalSold += dayTotal
		}

		// Previsions, Month Objectives, ADS, etc. (dummy values for now)
		previsions := int64(0)
		monthObj := int64(0)
		ads := float64(totalSold) / 6.0
		currentADS := ads // Placeholder, can be replaced with current week/day logic
		adsvscads := 100.0
		soldVsPrev := 0.0

		// TODO: Fetch real previsions and objectives from related tables

		if previsions > 0 {
			soldVsPrev = float64(totalSold) / float64(previsions) * 100.0
		}
		if currentADS > 0 {
			adsvscads = ads / currentADS * 100.0
		}

		dashboardData = append(dashboardData, AreaSalesDashboard{
			Area:       area,
			Lundi:      salesByDay["Lundi"],
			Mardi:      salesByDay["Mardi"],
			Mercredi:   salesByDay["Mercredi"],
			Jeudi:      salesByDay["Jeudi"],
			Vendredi:   salesByDay["Vendredi"],
			Samedi:     salesByDay["Samedi"],
			TotalSold:  totalSold,
			Previsions: previsions,
			SoldVsPrev: soldVsPrev,
			MonthObj:   monthObj,
			ADS:        ads,
			CurrentADS: currentADS,
			ADSvsCADS:  adsvscads,
		})
	}

	return c.JSON(dashboardData)
}

// YearObjectiveProgress represents year objective vs monthly progress
type YearObjectiveProgress struct {
	Province           string                 `json:"province"`
	ProvinceUUID       string                 `json:"province_uuid"`
	YearObjective      int64                  `json:"year_objective"`
	TotalAchieved      int64                  `json:"total_achieved"`
	ProgressPercentage float64                `json:"progress_percentage"`
	AchievementLevel   string                 `json:"achievement_level"`
	MonthlyBreakdown   []MonthlyProgress      `json:"monthly_breakdown"`
	GraphData          YearObjectiveGraphData `json:"graph_data"`
}

type MonthlyProgress struct {
	Month       string  `json:"month"`
	MonthNumber int     `json:"month_number"`
	Achieved    int64   `json:"achieved"`
	Target      int64   `json:"target"`
	Percentage  float64 `json:"percentage"`
}

type YearObjectiveGraphData struct {
	Labels      []string  `json:"labels"`
	Objectives  []int64   `json:"objectives"`
	Achieved    []int64   `json:"achieved"`
	Percentages []float64 `json:"percentages"`
}

// ProvinceYearSummary represents comprehensive year summary for a province
type ProvinceYearSummary struct {
	Province             string               `json:"province"`
	ProvinceUUID         string               `json:"province_uuid"`
	Year                 string               `json:"year"`
	YearObjective        int64                `json:"year_objective"`
	TotalSales           int64                `json:"total_sales"`
	ProgressPercentage   float64              `json:"progress_percentage"`
	AchievementLevel     string               `json:"achievement_level"`
	BestMonth            MonthPerformance     `json:"best_month"`
	WorstMonth           MonthPerformance     `json:"worst_month"`
	AverageMonthlySales  float64              `json:"average_monthly_sales"`
	RemainingToTarget    int64                `json:"remaining_to_target"`
	ProjectedYearEnd     int64                `json:"projected_year_end"`
	IsOnTrack            bool                 `json:"is_on_track"`
	QuarterlyPerformance []QuarterPerformance `json:"quarterly_performance"`
	MonthlyTrend         []MonthlyTrendPoint  `json:"monthly_trend"`
}

type MonthPerformance struct {
	Month       string  `json:"month"`
	MonthNumber int     `json:"month_number"`
	Sales       int64   `json:"sales"`
	Percentage  float64 `json:"percentage_of_objective"`
}

type QuarterPerformance struct {
	Quarter          string  `json:"quarter"`
	Sales            int64   `json:"sales"`
	Target           int64   `json:"target"`
	Percentage       float64 `json:"percentage"`
	AchievementLevel string  `json:"achievement_level"`
}

type MonthlyTrendPoint struct {
	Month       string `json:"month"`
	MonthNumber int    `json:"month_number"`
	Sales       int64  `json:"sales"`
	Cumulative  int64  `json:"cumulative"`
	Trend       string `json:"trend"` // "increasing", "decreasing", "stable"
}

// GetYearObjectiveComparison compares year objectives to monthly progress for all provinces
func GetYearObjectiveComparison(c *fiber.Ctx) error {
	db := database.DB

	// Get year parameter or default to current year
	yearParam := c.Query("year", strconv.Itoa(time.Now().Year()))

	// Get all provinces
	var provinces []models.Province
	if err := db.Find(&provinces).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch provinces",
		})
	}

	var results []YearObjectiveProgress

	for _, province := range provinces {
		// Get year objective for this province (from Year model)
		var yearObjective int64 = 0
		var yearRecord models.Year
		db.Where("year = ?", yearParam).First(&yearRecord)
		if yearRecord.Quantity != "" {
			if qty, err := strconv.ParseInt(yearRecord.Quantity, 10, 64); err == nil {
				yearObjective = qty
			}
		}

		// Calculate monthly progress
		monthlyBreakdown := make([]MonthlyProgress, 0)
		var totalAchieved int64 = 0

		// Get monthly sales data
		for month := 1; month <= 12; month++ {
			var monthlySales int64
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?",
					province.UUID, yearParam, month).
				Select("COALESCE(SUM(quantity), 0)").
				Scan(&monthlySales)

			totalAchieved += monthlySales

			// Calculate monthly target (assume equal distribution)
			monthlyTarget := yearObjective / 12
			var percentage float64 = 0
			if monthlyTarget > 0 {
				percentage = (float64(monthlySales) / float64(monthlyTarget)) * 100
			}

			monthNames := []string{"", "January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"}

			monthlyBreakdown = append(monthlyBreakdown, MonthlyProgress{
				Month:       monthNames[month],
				MonthNumber: month,
				Achieved:    monthlySales,
				Target:      monthlyTarget,
				Percentage:  percentage,
			})
		}

		// Calculate overall progress percentage
		var progressPercentage float64 = 0
		if yearObjective > 0 {
			progressPercentage = (float64(totalAchieved) / float64(yearObjective)) * 100
		}

		// Determine achievement level
		achievementLevel := getAchievementLevel(progressPercentage)

		// Prepare graph data
		labels := make([]string, 12)
		objectives := make([]int64, 12)
		achieved := make([]int64, 12)
		percentages := make([]float64, 12)

		for i, monthly := range monthlyBreakdown {
			labels[i] = monthly.Month
			objectives[i] = monthly.Target
			achieved[i] = monthly.Achieved
			percentages[i] = monthly.Percentage
		}

		graphData := YearObjectiveGraphData{
			Labels:      labels,
			Objectives:  objectives,
			Achieved:    achieved,
			Percentages: percentages,
		}

		results = append(results, YearObjectiveProgress{
			Province:           province.Name,
			ProvinceUUID:       province.UUID,
			YearObjective:      yearObjective,
			TotalAchieved:      totalAchieved,
			ProgressPercentage: progressPercentage,
			AchievementLevel:   achievementLevel,
			MonthlyBreakdown:   monthlyBreakdown,
			GraphData:          graphData,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Year objective comparison retrieved successfully",
		"data":    results,
		"year":    yearParam,
	})
}

// GetYearObjectiveComparisonTable returns table-formatted data
func GetYearObjectiveComparisonTable(c *fiber.Ctx) error {
	db := database.DB

	yearParam := c.Query("year", strconv.Itoa(time.Now().Year()))

	type TableRow struct {
		Province           string  `json:"province"`
		ProvinceUUID       string  `json:"province_uuid"`
		YearObjective      int64   `json:"year_objective"`
		TotalAchieved      int64   `json:"total_achieved"`
		ProgressPercentage float64 `json:"progress_percentage"`
		AchievementLevel   string  `json:"achievement_level"`
		Remaining          int64   `json:"remaining"`
		Status             string  `json:"status"`
	}

	var provinces []models.Province
	if err := db.Find(&provinces).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch provinces",
		})
	}

	var tableData []TableRow

	for _, province := range provinces {
		// Get year objective
		var yearObjective int64 = 0
		var yearRecord models.Year
		db.Where("year = ?", yearParam).First(&yearRecord)
		if yearRecord.Quantity != "" {
			if qty, err := strconv.ParseInt(yearRecord.Quantity, 10, 64); err == nil {
				yearObjective = qty
			}
		}

		// Calculate total achieved
		var totalAchieved int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ?", province.UUID, yearParam).
			Select("COALESCE(SUM(quantity), 0)").
			Scan(&totalAchieved)

		// Calculate progress
		var progressPercentage float64 = 0
		if yearObjective > 0 {
			progressPercentage = (float64(totalAchieved) / float64(yearObjective)) * 100
		}

		achievementLevel := getAchievementLevel(progressPercentage)
		remaining := yearObjective - totalAchieved
		if remaining < 0 {
			remaining = 0
		}

		status := "On Track"
		if progressPercentage < 50 {
			status = "Behind"
		} else if progressPercentage > 100 {
			status = "Exceeded"
		}

		tableData = append(tableData, TableRow{
			Province:           province.Name,
			ProvinceUUID:       province.UUID,
			YearObjective:      yearObjective,
			TotalAchieved:      totalAchieved,
			ProgressPercentage: progressPercentage,
			AchievementLevel:   achievementLevel,
			Remaining:          remaining,
			Status:             status,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Year objective table data retrieved successfully",
		"data":    tableData,
		"year":    yearParam,
	})
}

// GetProvinceYearSummary returns comprehensive year summary for each province
func GetProvinceYearSummary(c *fiber.Ctx) error {
	db := database.DB

	yearParam := c.Query("year", strconv.Itoa(time.Now().Year()))
	provinceUUIDParam := c.Query("province_uuid", "")

	var provinces []models.Province
	if provinceUUIDParam != "" {
		// Get specific province
		if err := db.Where("uuid = ?", provinceUUIDParam).Find(&provinces).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch province",
			})
		}
	} else {
		// Get all provinces
		if err := db.Find(&provinces).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch provinces",
			})
		}
	}

	var results []ProvinceYearSummary

	for _, province := range provinces {
		// Get year objective
		var yearObjective int64 = 0
		var yearRecord models.Year
		db.Where("year = ?", yearParam).First(&yearRecord)
		if yearRecord.Quantity != "" {
			if qty, err := strconv.ParseInt(yearRecord.Quantity, 10, 64); err == nil {
				yearObjective = qty
			}
		}

		// Calculate total sales for the year
		var totalSales int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ?", province.UUID, yearParam).
			Select("COALESCE(SUM(quantity), 0)").
			Scan(&totalSales)

		// Calculate progress percentage
		var progressPercentage float64 = 0
		if yearObjective > 0 {
			progressPercentage = (float64(totalSales) / float64(yearObjective)) * 100
		}

		achievementLevel := getAchievementLevel(progressPercentage)

		// Find best and worst performing months
		var bestMonth, worstMonth MonthPerformance
		var maxSales, minSales int64 = 0, int64(^uint64(0) >> 1) // Max int64

		monthlyData := make([]MonthlyTrendPoint, 0)
		var cumulativeSales int64 = 0

		for month := 1; month <= 12; month++ {
			var monthlySales int64
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?",
					province.UUID, yearParam, month).
				Select("COALESCE(SUM(quantity), 0)").
				Scan(&monthlySales)

			cumulativeSales += monthlySales

			monthNames := []string{"", "January", "February", "March", "April", "May", "June",
				"July", "August", "September", "October", "November", "December"}

			// Track best/worst months
			if monthlySales > maxSales {
				maxSales = monthlySales
				bestMonth = MonthPerformance{
					Month:       monthNames[month],
					MonthNumber: month,
					Sales:       monthlySales,
					Percentage:  (float64(monthlySales) / float64(yearObjective)) * 100,
				}
			}

			if monthlySales < minSales && monthlySales > 0 {
				minSales = monthlySales
				worstMonth = MonthPerformance{
					Month:       monthNames[month],
					MonthNumber: month,
					Sales:       monthlySales,
					Percentage:  (float64(monthlySales) / float64(yearObjective)) * 100,
				}
			}

			// Determine trend
			trend := "stable"
			if month > 1 && len(monthlyData) > 0 {
				prevSales := monthlyData[len(monthlyData)-1].Sales
				if monthlySales > prevSales {
					trend = "increasing"
				} else if monthlySales < prevSales {
					trend = "decreasing"
				}
			}

			monthlyData = append(monthlyData, MonthlyTrendPoint{
				Month:       monthNames[month],
				MonthNumber: month,
				Sales:       monthlySales,
				Cumulative:  cumulativeSales,
				Trend:       trend,
			})
		}

		// Calculate quarterly performance
		quarters := []QuarterPerformance{
			calculateQuarterPerformance(db, province.UUID, yearParam, 1, yearObjective, "Q1"),
			calculateQuarterPerformance(db, province.UUID, yearParam, 2, yearObjective, "Q2"),
			calculateQuarterPerformance(db, province.UUID, yearParam, 3, yearObjective, "Q3"),
			calculateQuarterPerformance(db, province.UUID, yearParam, 4, yearObjective, "Q4"),
		}

		// Calculate averages and projections
		averageMonthlySales := float64(totalSales) / 12.0
		remainingToTarget := yearObjective - totalSales
		if remainingToTarget < 0 {
			remainingToTarget = 0
		}

		// Project year-end based on current performance
		currentMonth := int(time.Now().Month())
		var projectedYearEnd int64 = totalSales
		if currentMonth > 0 {
			projectedYearEnd = int64((float64(totalSales) / float64(currentMonth)) * 12)
		}

		isOnTrack := progressPercentage >= 75 // Consider on track if >75%

		results = append(results, ProvinceYearSummary{
			Province:             province.Name,
			ProvinceUUID:         province.UUID,
			Year:                 yearParam,
			YearObjective:        yearObjective,
			TotalSales:           totalSales,
			ProgressPercentage:   progressPercentage,
			AchievementLevel:     achievementLevel,
			BestMonth:            bestMonth,
			WorstMonth:           worstMonth,
			AverageMonthlySales:  averageMonthlySales,
			RemainingToTarget:    remainingToTarget,
			ProjectedYearEnd:     projectedYearEnd,
			IsOnTrack:            isOnTrack,
			QuarterlyPerformance: quarters,
			MonthlyTrend:         monthlyData,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Province year summary retrieved successfully",
		"data":    results,
		"year":    yearParam,
	})
}

// Helper function to determine achievement level based on progress percentage
func getAchievementLevel(progressPercentage float64) string {
	switch {
	case progressPercentage >= 100:
		return "Excellent - Target Achieved"
	case progressPercentage >= 90:
		return "Very Good - Near Target"
	case progressPercentage >= 75:
		return "Good - On Track"
	case progressPercentage >= 50:
		return "Fair - Behind Schedule"
	case progressPercentage >= 25:
		return "Poor - Significantly Behind"
	default:
		return "Critical - Far Behind Target"
	}
}

// Helper function to calculate quarterly performance
func calculateQuarterPerformance(db *gorm.DB, provinceUUID, year string, quarter int, yearObjective int64, quarterName string) QuarterPerformance {
	var startMonth, endMonth int
	switch quarter {
	case 1:
		startMonth, endMonth = 1, 3
	case 2:
		startMonth, endMonth = 4, 6
	case 3:
		startMonth, endMonth = 7, 9
	case 4:
		startMonth, endMonth = 10, 12
	}

	var quarterSales int64
	db.Model(&models.Sale{}).
		Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) BETWEEN ? AND ?",
			provinceUUID, year, startMonth, endMonth).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&quarterSales)

	quarterTarget := yearObjective / 4 // Assume equal quarterly targets
	var percentage float64 = 0
	if quarterTarget > 0 {
		percentage = (float64(quarterSales) / float64(quarterTarget)) * 100
	}

	return QuarterPerformance{
		Quarter:          quarterName,
		Sales:            quarterSales,
		Target:           quarterTarget,
		Percentage:       percentage,
		AchievementLevel: getAchievementLevel(percentage),
	}
}
