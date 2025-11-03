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

	// Get best and worst provinces with targets from Year/Month/Week tables
	var bestProvince, worstProvince ProvincePerformance
	if len(provincialPerformance) > 0 {
		// Get real targets from Year/Month/Week tables based on date range
		var provinceFilter []string
		if provinceUUID != "" {
			provinceFilter = []string{provinceUUID}
		}
		targets, err := getTargetsForDateRange(dateRange, provinceFilter)
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
			Select("EXTRACT(WEEK FROM created_at) as week_num, EXTRACT(YEAR FROM created_at) as year_num, COALESCE(SUM(quantity), 0) as sales").
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?",
				province.UUID, dateRange.StartDate, dateRange.EndDate).
			Group("week_num, year_num").
			Order("year_num, week_num").
			Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var weekNum int
			var yearNum int
			var sales int64
			if err := rows.Scan(&weekNum, &yearNum, &sales); err != nil {
				return nil, err
			}

			// Get target for this week from Week table
			target, _ := getWeeklyTargetByProvince(province.UUID, yearNum, weekNum)

			// Calculate deviation from target
			var deviation float64
			if target > 0 {
				deviation = float64(sales-target) / float64(target) * 100
			}

			periodData = append(periodData, PeriodSales{
				Period:    fmt.Sprintf("Week %d", weekNum),
				Sales:     sales,
				Deviation: deviation,
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

// getProvincialTargets has been replaced by getTargetsForDateRange in targetHelpers.go
// This function is deprecated and kept only for backwards compatibility
func getProvincialTargets(dateRange DateRange, provinceUUID string) (map[string]int64, error) {
	var provinceFilter []string
	if provinceUUID != "" {
		provinceFilter = []string{provinceUUID}
	}
	return getTargetsForDateRange(dateRange, provinceFilter)
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
			Select("TO_CHAR(created_at, 'Month') as month_name, EXTRACT(MONTH FROM created_at) as month_num, EXTRACT(YEAR FROM created_at) as year_num, COALESCE(SUM(quantity), 0) as sales").
			Where("province_uuid = ? AND created_at BETWEEN ? AND ?",
				province.UUID, dateRange.StartDate, dateRange.EndDate).
			Group("month_name, month_num, year_num").
			Order("year_num, month_num").
			Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var monthName string
			var monthNum int
			var yearNum int
			var sales int64
			if err := rows.Scan(&monthName, &monthNum, &yearNum, &sales); err != nil {
				return nil, err
			}

			// Get target for this month from Month table
			target, _ := getMonthlyTargetByProvince(province.UUID, yearNum, monthNum)

			// Calculate deviation from target
			var deviation float64
			if target > 0 {
				deviation = float64(sales-target) / float64(target) * 100
			}

			periodData = append(periodData, PeriodSales{
				Period:    monthName,
				Sales:     sales,
				Deviation: deviation,
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
