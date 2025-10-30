package dashboard

import (
	"fmt"
	"sort"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

type DateRange struct {
	StartDate time.Time `json:"start_date"`
	EndDate   time.Time `json:"end_date"`
}

type GlobalOverviewResponse struct {
	TotalSales           int64                 `json:"total_sales"`
	PreviousPeriodChange float64               `json:"previous_period_change"`
	AverageDailySales    float64               `json:"average_daily_sales"`
	BestProvince         ProvincePerformance   `json:"best_province"`
	WorstProvince        ProvincePerformance   `json:"worst_province"`
	SalesTrend           SalesTrendData        `json:"sales_trend"`
	ProvincialSales      []ProvincePerformance `json:"provincial_sales"`
	SalesHeatmap         []ProvinceHeatmap     `json:"sales_heatmap"`
	TimeGranularity      string                `json:"time_granularity"` // "daily", "weekly", or "monthly"
}

type SalesTrendData struct {
	Labels   []string `json:"labels"`   // Time labels (dates/weeks/months)
	Values   []int64  `json:"values"`   // Sales values
	Interval string   `json:"interval"` // Time interval (day/week/month)
}

type ProvincePerformance struct {
	UUID        string  `json:"uuid"`
	Name        string  `json:"name"`
	TotalSales  int64   `json:"total_sales"`
	Target      int64   `json:"target"`      // Sales target for the province
	Achievement float64 `json:"achievement"` // Percentage of target achieved
}

type DailySales struct {
	Date  time.Time `json:"date"`
	Sales int64     `json:"sales"`
}

type ProvinceHeatmap struct {
	ProvinceUUID string        `json:"province_uuid"`
	ProvinceName string        `json:"province_name"`
	PeriodData   []PeriodSales `json:"period_data"`
}

type PeriodSales struct {
	Period    string  `json:"period"` // Week number or Month name
	Sales     int64   `json:"sales"`
	Deviation float64 `json:"deviation"` // Percentage deviation from target
}

// GetGlobalOverview handles the dashboard data retrieval
func GetGlobalOverview(c *fiber.Ctx) error {
	// Parse date range from query parameters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	provinceUUID := c.Query("province_uuid") // Get optional province filter

	if startDate == "" || endDate == "" {
		// Default to current month if no date range provided
		now := time.Now()
		startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
		startDate = startOfMonth.Format("2025-01-01")
		endDate = now.Format("2025-12-30")
	}

	dateRange, err := parseDateRange(startDate, endDate)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid date range",
			"error":   err.Error(),
		})
	}

	// Get all the required data
	response, err := getOverviewData(dateRange, provinceUUID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Error fetching dashboard data",
			"error":   err.Error(),
		})
	}

	return c.JSON(response)
}

func parseDateRange(startDate, endDate string) (DateRange, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return DateRange{}, err
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return DateRange{}, err
	}

	return DateRange{
		StartDate: start,
		EndDate:   end,
	}, nil
}

func getOverviewData(dateRange DateRange, provinceUUID string) (GlobalOverviewResponse, error) {
	db := database.DB

	// Build base query with optional province filter
	baseQuery := db.Model(&models.Sale{}).
		Where("created_at BETWEEN ? AND ?", dateRange.StartDate, dateRange.EndDate)

	if provinceUUID != "" {
		baseQuery = baseQuery.Where("province_uuid = ?", provinceUUID)
	}

	// Get total sales for current period
	var totalSales int64
	err := baseQuery.
		Select("COALESCE(SUM(quantity), 0)").
		Row().
		Scan(&totalSales)
	if err != nil {
		return GlobalOverviewResponse{}, err
	}

	// Calculate previous period
	periodDuration := dateRange.EndDate.Sub(dateRange.StartDate)
	previousStart := dateRange.StartDate.Add(-periodDuration)
	previousEnd := dateRange.StartDate

	// Get previous period sales with same province filter
	previousQuery := db.Model(&models.Sale{}).
		Where("created_at BETWEEN ? AND ?", previousStart, previousEnd)

	if provinceUUID != "" {
		previousQuery = previousQuery.Where("province_uuid = ?", provinceUUID)
	}

	var previousSales int64
	err = previousQuery.
		Select("COALESCE(SUM(quantity), 0)").
		Row().
		Scan(&previousSales)
	if err != nil {
		return GlobalOverviewResponse{}, err
	}

	// Calculate percentage change
	var percentageChange float64
	if previousSales > 0 {
		percentageChange = float64(totalSales-previousSales) / float64(previousSales) * 100
	}

	// Calculate average daily sales
	days := dateRange.EndDate.Sub(dateRange.StartDate).Hours() / 24
	averageDailySales := float64(totalSales) / days

	// Get provincial performance with optional filter
	var provincialPerformance []ProvincePerformance
	provincialQuery := db.Model(&models.Sale{}).
		Select("provinces.uuid, provinces.name, COALESCE(SUM(sales.quantity), 0) as total_sales").
		Joins("JOIN provinces ON provinces.uuid = sales.province_uuid").
		Where("sales.created_at BETWEEN ? AND ?", dateRange.StartDate, dateRange.EndDate)

	if provinceUUID != "" {
		provincialQuery = provincialQuery.Where("sales.province_uuid = ?", provinceUUID)
	}

	err = provincialQuery.
		Group("provinces.uuid, provinces.name").
		Order("total_sales DESC").
		Find(&provincialPerformance).Error
	if err != nil {
		return GlobalOverviewResponse{}, err
	}

	// Determine time granularity based on date range
	duration := dateRange.EndDate.Sub(dateRange.StartDate)
	timeGranularity := "daily"
	if duration > 90*24*time.Hour {
		timeGranularity = "monthly"
	} else if duration > 31*24*time.Hour {
		timeGranularity = "weekly"
	}

	// Get sales trend based on granularity
	salesTrend, err := getSalesTrend(dateRange, timeGranularity, provinceUUID)
	if err != nil {
		return GlobalOverviewResponse{}, err
	}

	// Get best and worst provinces with targets
	var bestProvince, worstProvince ProvincePerformance
	if len(provincialPerformance) > 0 {
		// Get targets for provinces (You'll need to implement this based on your target storage)
		targets, err := getProvincialTargets(dateRange, provinceUUID)
		if err != nil {
			return GlobalOverviewResponse{}, err
		}

		// Update provincial performance with targets
		for i := range provincialPerformance {
			target := targets[provincialPerformance[i].UUID]
			provincialPerformance[i].Target = target
			if target > 0 {
				provincialPerformance[i].Achievement = float64(provincialPerformance[i].TotalSales) / float64(target) * 100
			}
		}

		bestProvince = provincialPerformance[0]
		worstProvince = provincialPerformance[len(provincialPerformance)-1]
	}

	// Get weekly/monthly heatmap data
	var heatmap []ProvinceHeatmap
	if timeGranularity == "daily" || timeGranularity == "weekly" {
		heatmap, err = getWeeklyHeatmap(dateRange, provinceUUID)
	} else {
		heatmap, err = getMonthlyHeatmap(dateRange, provinceUUID)
	}
	if err != nil {
		return GlobalOverviewResponse{}, err
	}

	// Sort provincial sales by achievement percentage for more accurate rankings
	sort.Slice(provincialPerformance, func(i, j int) bool {
		return provincialPerformance[i].Achievement > provincialPerformance[j].Achievement
	})

	return GlobalOverviewResponse{
		TotalSales:           totalSales,
		PreviousPeriodChange: percentageChange,
		AverageDailySales:    averageDailySales,
		BestProvince:         bestProvince,
		WorstProvince:        worstProvince,
		SalesTrend:           salesTrend,
		ProvincialSales:      provincialPerformance,
		SalesHeatmap:         heatmap,
		TimeGranularity:      timeGranularity,
	}, nil
}

func getWeeklyHeatmap(dateRange DateRange, provinceUUID string) ([]ProvinceHeatmap, error) {
	db := database.DB
	var heatmap []ProvinceHeatmap

	// Get provinces based on filter
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if provinceUUID != "" {
		provinceQuery = provinceQuery.Where("uuid = ?", provinceUUID)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	for _, province := range provinces {
		var periodData []PeriodSales

		// Get weekly sales data for the province
		rows, err := db.Model(&models.Sale{}).
			Select("EXTRACT(WEEK FROM created_at) as week_num, COALESCE(SUM(quantity), 0) as sales").
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?",
				province.UUID, dateRange.StartDate, dateRange.EndDate).
			Group("week_num").
			Order("week_num").
			Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var weekNum int
			var sales int64
			if err := rows.Scan(&weekNum, &sales); err != nil {
				return nil, err
			}

			periodData = append(periodData, PeriodSales{
				Period: fmt.Sprintf("Week %d", weekNum),
				Sales:  sales,
				// Calculate deviation from target here if targets are available
				Deviation: 0,
			})
		}

		heatmap = append(heatmap, ProvinceHeatmap{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			PeriodData:   periodData,
		})
	}

	return heatmap, nil
}

// getSalesTrend returns sales trend data with appropriate time granularity
func getSalesTrend(dateRange DateRange, granularity string, provinceUUID string) (SalesTrendData, error) {
	db := database.DB
	var result SalesTrendData
	result.Interval = granularity

	var query string
	var args []interface{}

	// Build WHERE clause for province filter
	provinceFilter := ""
	if provinceUUID != "" {
		provinceFilter = "AND province_uuid = ?"
	}

	switch granularity {
	case "daily":
		query = `
			SELECT 
				TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as label,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY DATE(created_at)
			ORDER BY DATE(created_at)
		`
		if provinceUUID != "" {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUID}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}

	case "weekly":
		query = `
			SELECT 
				CONCAT('Week ', EXTRACT(WEEK FROM created_at)) as label,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY EXTRACT(WEEK FROM created_at)
			ORDER BY EXTRACT(WEEK FROM created_at)
		`
		if provinceUUID != "" {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUID}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}

	case "monthly":
		query = `
			SELECT 
				TO_CHAR(created_at, 'Month YYYY') as label,
				COALESCE(SUM(quantity), 0) as sales
			FROM sales 
			WHERE created_at BETWEEN ? AND ? ` + provinceFilter + `
			GROUP BY TO_CHAR(created_at, 'Month YYYY'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
			ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
		`
		if provinceUUID != "" {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate, provinceUUID}
		} else {
			args = []interface{}{dateRange.StartDate, dateRange.EndDate}
		}
	}

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return result, err
	}
	defer rows.Close()

	for rows.Next() {
		var label string
		var sales int64
		if err := rows.Scan(&label, &sales); err != nil {
			return result, err
		}
		result.Labels = append(result.Labels, label)
		result.Values = append(result.Values, sales)
	}

	return result, nil
}

// getProvincialTargets returns a map of province UUIDs to their sales targets
func getProvincialTargets(dateRange DateRange, provinceUUID string) (map[string]int64, error) {
	// This is a placeholder implementation. You'll need to implement this based on
	// how you store and calculate targets in your system.
	// Options:
	// 1. Fixed targets from configuration
	// 2. Calculated based on historical data
	// 3. Stored in a separate table
	// For now, we'll return some dummy targets

	db := database.DB
	targets := make(map[string]int64)

	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if provinceUUID != "" {
		provinceQuery = provinceQuery.Where("uuid = ?", provinceUUID)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// For demonstration, set target as 120% of average historical sales
	for _, province := range provinces {
		var avgSales int64
		err := db.Model(&models.Sale{}).
			Select("COALESCE(AVG(quantity), 0)").
			Where("province_uuid = ? AND created_at < ?",
				province.UUID, dateRange.StartDate).
			Row().
			Scan(&avgSales)
		if err != nil {
			return nil, err
		}

		targets[province.UUID] = int64(float64(avgSales) * 1.2)
	}

	return targets, nil
}

func getMonthlyHeatmap(dateRange DateRange, provinceUUID string) ([]ProvinceHeatmap, error) {
	db := database.DB
	var heatmap []ProvinceHeatmap

	// Get provinces based on filter
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if provinceUUID != "" {
		provinceQuery = provinceQuery.Where("uuid = ?", provinceUUID)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	for _, province := range provinces {
		var periodData []PeriodSales

		// Get monthly sales data for the province
		rows, err := db.Model(&models.Sale{}).
			Select("TO_CHAR(created_at, 'Month') as month_name, COALESCE(SUM(quantity), 0) as sales").
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?",
				province.UUID, dateRange.StartDate, dateRange.EndDate).
			Group("month_name").
			Order("month_name").
			Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var monthName string
			var sales int64
			if err := rows.Scan(&monthName, &sales); err != nil {
				return nil, err
			}

			periodData = append(periodData, PeriodSales{
				Period: monthName,
				Sales:  sales,
				// Calculate deviation from target here if targets are available
				Deviation: 0,
			})
		}

		heatmap = append(heatmap, ProvinceHeatmap{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			PeriodData:   periodData,
		})
	}

	return heatmap, nil
}
