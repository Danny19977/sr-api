package dashboard

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

// OverallSummaryDashboard represents the overall summary across all provinces
type OverallSummaryDashboard struct {
	TotalProvinces            int                     `json:"total_provinces"`
	Year                      string                  `json:"year"`
	TotalYearObjective        int64                   `json:"total_year_objective"`
	TotalAchieved             int64                   `json:"total_achieved"`
	OverallProgressPercentage float64                 `json:"overall_progress_percentage"`
	ProvincesOnTrack          int                     `json:"provinces_on_track"`
	ProvincesExceeded         int                     `json:"provinces_exceeded"`
	ProvincesBehind           int                     `json:"provinces_behind"`
	TopPerformingProvinces    []ProvinceRanking       `json:"top_performing_provinces"`
	BottomPerformingProvinces []ProvinceRanking       `json:"bottom_performing_provinces"`
	MonthlyAggregateProgress  []MonthlyAggregate      `json:"monthly_aggregate_progress"`
	AchievementDistribution   AchievementDistribution `json:"achievement_distribution"`
}

type ProvinceRanking struct {
	Rank             int     `json:"rank"`
	Province         string  `json:"province"`
	ProvinceUUID     string  `json:"province_uuid"`
	Achieved         int64   `json:"achieved"`
	Objective        int64   `json:"objective"`
	Percentage       float64 `json:"percentage"`
	AchievementLevel string  `json:"achievement_level"`
}

type MonthlyAggregate struct {
	Month              string  `json:"month"`
	MonthNumber        int     `json:"month_number"`
	TotalAchieved      int64   `json:"total_achieved"`
	TotalTarget        int64   `json:"total_target"`
	Percentage         float64 `json:"percentage"`
	ProvincesMetTarget int     `json:"provinces_met_target"`
}

type AchievementDistribution struct {
	Excellent int `json:"excellent"` // >= 100%
	VeryGood  int `json:"very_good"` // 90-99%
	Good      int `json:"good"`      // 75-89%
	Fair      int `json:"fair"`      // 50-74%
	Poor      int `json:"poor"`      // 25-49%
	Critical  int `json:"critical"`  // < 25%
}

// ComparisonSummary represents comparison data suitable for both table and graph display
type ComparisonSummary struct {
	TableData []TableComparisonRow   `json:"table_data"`
	GraphData GraphComparisonData    `json:"graph_data"`
	Summary   ComparisonSummaryStats `json:"summary"`
}

type TableComparisonRow struct {
	Province         string  `json:"province"`
	ProvinceUUID     string  `json:"province_uuid"`
	Objective        int64   `json:"objective"`
	Achieved         int64   `json:"achieved"`
	Percentage       float64 `json:"percentage"`
	Remaining        int64   `json:"remaining"`
	AchievementLevel string  `json:"achievement_level"`
	Rank             int     `json:"rank"`
	Status           string  `json:"status"`
	Trend            string  `json:"trend"`
}

type GraphComparisonData struct {
	ProvinceNames     []string  `json:"province_names"`
	Objectives        []int64   `json:"objectives"`
	Achieved          []int64   `json:"achieved"`
	Percentages       []float64 `json:"percentages"`
	AchievementColors []string  `json:"achievement_colors"`
}

type ComparisonSummaryStats struct {
	TotalProvinces    int     `json:"total_provinces"`
	AveragePercentage float64 `json:"average_percentage"`
	MedianPercentage  float64 `json:"median_percentage"`
	BestPerformance   float64 `json:"best_performance"`
	WorstPerformance  float64 `json:"worst_performance"`
	StandardDeviation float64 `json:"standard_deviation"`
}

// GetOverallSummaryDashboard returns comprehensive summary across all provinces
func GetOverallSummaryDashboard(c *fiber.Ctx) error {
	db := database.DB

	yearParam := c.Query("year", strconv.Itoa(time.Now().Year()))

	// Get all provinces
	var provinces []models.Province
	if err := db.Find(&provinces).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch provinces",
		})
	}

	totalProvinces := len(provinces)
	var totalYearObjective int64 = 0
	var totalAchieved int64 = 0
	var provincesOnTrack, provincesExceeded, provincesBehind int

	rankings := make([]ProvinceRanking, 0)
	achievementDist := AchievementDistribution{}

	// Calculate per province data
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

		// Calculate achieved
		var achieved int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ?", province.UUID, yearParam).
			Select("COALESCE(SUM(quantity), 0)").
			Scan(&achieved)

		totalYearObjective += yearObjective
		totalAchieved += achieved

		var percentage float64 = 0
		if yearObjective > 0 {
			percentage = (float64(achieved) / float64(yearObjective)) * 100
		}

		achievementLevel := getAchievementLevel(percentage)

		// Count achievement categories
		switch {
		case percentage >= 100:
			achievementDist.Excellent++
			provincesExceeded++
		case percentage >= 90:
			achievementDist.VeryGood++
			provincesOnTrack++
		case percentage >= 75:
			achievementDist.Good++
			provincesOnTrack++
		case percentage >= 50:
			achievementDist.Fair++
			provincesBehind++
		case percentage >= 25:
			achievementDist.Poor++
			provincesBehind++
		default:
			achievementDist.Critical++
			provincesBehind++
		}

		rankings = append(rankings, ProvinceRanking{
			Province:         province.Name,
			ProvinceUUID:     province.UUID,
			Achieved:         achieved,
			Objective:        yearObjective,
			Percentage:       percentage,
			AchievementLevel: achievementLevel,
		})
	}

	// Sort rankings by percentage (descending)
	for i := range rankings {
		rankings[i].Rank = i + 1
	}

	// Get top 5 and bottom 5
	topPerforming := make([]ProvinceRanking, 0)
	bottomPerforming := make([]ProvinceRanking, 0)

	if len(rankings) > 0 {
		// Sort by percentage descending
		for i := 0; i < len(rankings)-1; i++ {
			for j := 0; j < len(rankings)-i-1; j++ {
				if rankings[j].Percentage < rankings[j+1].Percentage {
					rankings[j], rankings[j+1] = rankings[j+1], rankings[j]
				}
			}
		}

		// Update ranks after sorting
		for i := range rankings {
			rankings[i].Rank = i + 1
		}

		// Top 5
		for i := 0; i < 5 && i < len(rankings); i++ {
			topPerforming = append(topPerforming, rankings[i])
		}

		// Bottom 5
		start := len(rankings) - 5
		if start < 0 {
			start = 0
		}
		for i := start; i < len(rankings); i++ {
			bottomPerforming = append(bottomPerforming, rankings[i])
		}
	}

	// Calculate monthly aggregate progress
	monthlyProgress := make([]MonthlyAggregate, 0)
	monthNames := []string{"January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December"}

	for month := 1; month <= 12; month++ {
		var monthlyTotal int64
		var provincesMetTarget int
		monthlyTarget := totalYearObjective / 12

		for _, province := range provinces {
			var provinceMonthlySales int64
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?",
					province.UUID, yearParam, month).
				Select("COALESCE(SUM(quantity), 0)").
				Scan(&provinceMonthlySales)

			monthlyTotal += provinceMonthlySales

			// Check if province met monthly target
			var provinceObjective int64 = 0
			var yearRecord models.Year
			db.Where("year = ?", yearParam).First(&yearRecord)
			if yearRecord.Quantity != "" {
				if qty, err := strconv.ParseInt(yearRecord.Quantity, 10, 64); err == nil {
					provinceObjective = qty
				}
			}

			provinceMonthlyTarget := provinceObjective / 12
			if provinceMonthlySales >= provinceMonthlyTarget {
				provincesMetTarget++
			}
		}

		var monthlyPercentage float64 = 0
		if monthlyTarget > 0 {
			monthlyPercentage = (float64(monthlyTotal) / float64(monthlyTarget)) * 100
		}

		monthlyProgress = append(monthlyProgress, MonthlyAggregate{
			Month:              monthNames[month-1],
			MonthNumber:        month,
			TotalAchieved:      monthlyTotal,
			TotalTarget:        monthlyTarget,
			Percentage:         monthlyPercentage,
			ProvincesMetTarget: provincesMetTarget,
		})
	}

	// Calculate overall progress percentage
	var overallProgressPercentage float64 = 0
	if totalYearObjective > 0 {
		overallProgressPercentage = (float64(totalAchieved) / float64(totalYearObjective)) * 100
	}

	result := OverallSummaryDashboard{
		TotalProvinces:            totalProvinces,
		Year:                      yearParam,
		TotalYearObjective:        totalYearObjective,
		TotalAchieved:             totalAchieved,
		OverallProgressPercentage: overallProgressPercentage,
		ProvincesOnTrack:          provincesOnTrack,
		ProvincesExceeded:         provincesExceeded,
		ProvincesBehind:           provincesBehind,
		TopPerformingProvinces:    topPerforming,
		BottomPerformingProvinces: bottomPerforming,
		MonthlyAggregateProgress:  monthlyProgress,
		AchievementDistribution:   achievementDist,
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Overall summary dashboard retrieved successfully",
		"data":    result,
		"year":    yearParam,
	})
}

// GetComparisonSummary returns data formatted for both table and graph display
func GetComparisonSummary(c *fiber.Ctx) error {
	db := database.DB

	yearParam := c.Query("year", strconv.Itoa(time.Now().Year()))

	var provinces []models.Province
	if err := db.Find(&provinces).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch provinces",
		})
	}

	tableData := make([]TableComparisonRow, 0)
	provinceNames := make([]string, 0)
	objectives := make([]int64, 0)
	achieved := make([]int64, 0)
	percentages := make([]float64, 0)
	achievementColors := make([]string, 0)

	allPercentages := make([]float64, 0)

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

		// Calculate achieved
		var provinceAchieved int64
		db.Model(&models.Sale{}).
			Where("province_uuid = ? AND EXTRACT(YEAR FROM created_at) = ?", province.UUID, yearParam).
			Select("COALESCE(SUM(quantity), 0)").
			Scan(&provinceAchieved)

		var percentage float64 = 0
		if yearObjective > 0 {
			percentage = (float64(provinceAchieved) / float64(yearObjective)) * 100
		}

		remaining := yearObjective - provinceAchieved
		if remaining < 0 {
			remaining = 0
		}

		achievementLevel := getAchievementLevel(percentage)

		status := "On Track"
		if percentage < 50 {
			status = "Behind"
		} else if percentage > 100 {
			status = "Exceeded"
		}

		// Calculate trend (simplified - could be enhanced with more historical data)
		trend := "Stable"
		// You could add logic here to compare with previous periods

		// Color coding for achievements
		color := getAchievementColor(percentage)

		tableData = append(tableData, TableComparisonRow{
			Province:         province.Name,
			ProvinceUUID:     province.UUID,
			Objective:        yearObjective,
			Achieved:         provinceAchieved,
			Percentage:       percentage,
			Remaining:        remaining,
			AchievementLevel: achievementLevel,
			Status:           status,
			Trend:            trend,
		})

		// Graph data
		provinceNames = append(provinceNames, province.Name)
		objectives = append(objectives, yearObjective)
		achieved = append(achieved, provinceAchieved)
		percentages = append(percentages, percentage)
		achievementColors = append(achievementColors, color)
		allPercentages = append(allPercentages, percentage)
	}

	// Sort table data by percentage (descending) and assign ranks
	for i := 0; i < len(tableData)-1; i++ {
		for j := 0; j < len(tableData)-i-1; j++ {
			if tableData[j].Percentage < tableData[j+1].Percentage {
				tableData[j], tableData[j+1] = tableData[j+1], tableData[j]
			}
		}
	}

	// Assign ranks
	for i := range tableData {
		tableData[i].Rank = i + 1
	}

	// Calculate summary statistics
	summaryStats := calculateSummaryStats(allPercentages, len(provinces))

	graphData := GraphComparisonData{
		ProvinceNames:     provinceNames,
		Objectives:        objectives,
		Achieved:          achieved,
		Percentages:       percentages,
		AchievementColors: achievementColors,
	}

	result := ComparisonSummary{
		TableData: tableData,
		GraphData: graphData,
		Summary:   summaryStats,
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Comparison summary retrieved successfully",
		"data":    result,
		"year":    yearParam,
	})
}

// Helper function to get achievement color
func getAchievementColor(percentage float64) string {
	switch {
	case percentage >= 100:
		return "#28a745" // Green - Excellent
	case percentage >= 90:
		return "#6f42c1" // Purple - Very Good
	case percentage >= 75:
		return "#007bff" // Blue - Good
	case percentage >= 50:
		return "#ffc107" // Yellow - Fair
	case percentage >= 25:
		return "#fd7e14" // Orange - Poor
	default:
		return "#dc3545" // Red - Critical
	}
}

// Helper function to calculate summary statistics
func calculateSummaryStats(percentages []float64, totalProvinces int) ComparisonSummaryStats {
	if len(percentages) == 0 {
		return ComparisonSummaryStats{TotalProvinces: totalProvinces}
	}

	// Calculate average
	var sum float64
	for _, p := range percentages {
		sum += p
	}
	average := sum / float64(len(percentages))

	// Sort for median
	sortedPercentages := make([]float64, len(percentages))
	copy(sortedPercentages, percentages)
	for i := 0; i < len(sortedPercentages)-1; i++ {
		for j := 0; j < len(sortedPercentages)-i-1; j++ {
			if sortedPercentages[j] > sortedPercentages[j+1] {
				sortedPercentages[j], sortedPercentages[j+1] = sortedPercentages[j+1], sortedPercentages[j]
			}
		}
	}

	// Calculate median
	var median float64
	n := len(sortedPercentages)
	if n%2 == 0 {
		median = (sortedPercentages[n/2-1] + sortedPercentages[n/2]) / 2
	} else {
		median = sortedPercentages[n/2]
	}

	// Find best and worst
	best := sortedPercentages[n-1]
	worst := sortedPercentages[0]

	// Calculate standard deviation
	var variance float64
	for _, p := range percentages {
		variance += (p - average) * (p - average)
	}
	variance = variance / float64(len(percentages))
	standardDeviation := variance // Simplified - should be sqrt(variance)

	return ComparisonSummaryStats{
		TotalProvinces:    totalProvinces,
		AveragePercentage: average,
		MedianPercentage:  median,
		BestPerformance:   best,
		WorstPerformance:  worst,
		StandardDeviation: standardDeviation,
	}
}
