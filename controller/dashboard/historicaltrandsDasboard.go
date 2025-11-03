package dashboard

import (
	"fmt"
	"strings"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
)

type HistoricalTrendsResponse struct {
	CumulativeYearlySales []YearlyCumulativeSeries `json:"cumulative_yearly_sales"` // Horse race chart
	AnnualSalesByProvince []ProvinceAnnualData     `json:"annual_sales_by_province"` // Grouped bar chart
	YoYGrowthHeatmap      []ProvinceYoYGrowth      `json:"yoy_growth_heatmap"`       // Heatmap table
	SelectedYears         []int                    `json:"selected_years"`           // Years being compared
	ViewBy                string                   `json:"view_by"`                  // "monthly" or "quarterly"
}

type YearlyCumulativeSeries struct {
	Year       int         `json:"year"`
	DataPoints []TimeValue `json:"data_points"` // Cumulative sales over time
}

type TimeValue struct {
	Period     string `json:"period"`      // "Jan", "Feb" or "Q1", "Q2"
	MonthIndex int    `json:"month_index"` // 1-12 for sorting
	Value      int64  `json:"value"`       // Cumulative sales
}

type ProvinceAnnualData struct {
	ProvinceUUID string           `json:"province_uuid"`
	ProvinceName string           `json:"province_name"`
	YearlyData   []YearSalesData  `json:"yearly_data"` // Sales for each year
}

type YearSalesData struct {
	Year       int   `json:"year"`
	TotalSales int64 `json:"total_sales"`
}

type ProvinceYoYGrowth struct {
	ProvinceUUID   string               `json:"province_uuid"`
	ProvinceName   string               `json:"province_name"`
	PeriodGrowth   []PeriodGrowthData   `json:"period_growth"` // Growth % for each period
}

type PeriodGrowthData struct {
	Period         string  `json:"period"`          // "Jan", "Feb" or "Q1", "Q2"
	MonthIndex     int     `json:"month_index"`     // For sorting
	CurrentSales   int64   `json:"current_sales"`   // Current year sales
	PreviousSales  int64   `json:"previous_sales"`  // Previous year sales
	GrowthPercent  float64 `json:"growth_percent"`  // YoY % change
}

// GetHistoricalTrends handles the historical trends dashboard data retrieval
func GetHistoricalTrends(c *fiber.Ctx) error {
	// Parse query parameters
	yearsParam := c.Query("years")           // Comma-separated years: "2025,2024,2023"
	provincesParam := c.Query("provinces")   // Comma-separated province UUIDs
	singleProvince := c.Query("province_uuid")
	viewBy := c.Query("view_by")             // "monthly" or "quarterly"

	// Default to monthly view
	if viewBy == "" {
		viewBy = "monthly"
	}

	// Parse years (default to current year and previous 2 years)
	var years []int
	if yearsParam != "" {
		yearStrings := strings.Split(yearsParam, ",")
		for _, ys := range yearStrings {
			ys = strings.TrimSpace(ys)
			var year int
			fmt.Sscanf(ys, "%d", &year)
			if year > 0 {
				years = append(years, year)
			}
		}
	}
	if len(years) == 0 {
		currentYear := time.Now().Year()
		years = []int{currentYear, currentYear - 1, currentYear - 2}
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
	if len(provinceUUIDs) == 0 && singleProvince != "" {
		singleProvince = strings.TrimSpace(singleProvince)
		if singleProvince != "" {
			provinceUUIDs = []string{singleProvince}
		}
	}

	// Get all the required data
	response, err := getHistoricalTrendsData(years, provinceUUIDs, viewBy)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Error fetching historical trends data",
			"error":   err.Error(),
		})
	}

	return c.JSON(response)
}

func getHistoricalTrendsData(years []int, provinceUUIDs []string, viewBy string) (HistoricalTrendsResponse, error) {
	// Get cumulative yearly sales (horse race chart)
	cumulativeYearlySales, err := getCumulativeYearlySales(years, provinceUUIDs, viewBy)
	if err != nil {
		return HistoricalTrendsResponse{}, err
	}

	// Get annual sales by province (grouped bar chart)
	annualSalesByProvince, err := getAnnualSalesByProvince(years, provinceUUIDs)
	if err != nil {
		return HistoricalTrendsResponse{}, err
	}

	// Get YoY growth heatmap
	yoyGrowthHeatmap, err := getYoYGrowthHeatmap(years, provinceUUIDs, viewBy)
	if err != nil {
		return HistoricalTrendsResponse{}, err
	}

	return HistoricalTrendsResponse{
		CumulativeYearlySales: cumulativeYearlySales,
		AnnualSalesByProvince: annualSalesByProvince,
		YoYGrowthHeatmap:      yoyGrowthHeatmap,
		SelectedYears:         years,
		ViewBy:                viewBy,
	}, nil
}

// getCumulativeYearlySales returns cumulative sales for each year (horse race chart)
func getCumulativeYearlySales(years []int, provinceUUIDs []string, viewBy string) ([]YearlyCumulativeSeries, error) {
	db := database.DB
	var result []YearlyCumulativeSeries

	for _, year := range years {
		series := YearlyCumulativeSeries{
			Year:       year,
			DataPoints: []TimeValue{},
		}

		if viewBy == "quarterly" {
			// Quarterly view
			quarters := []struct {
				name   string
				index  int
				months []int
			}{
				{"Q1", 3, []int{1, 2, 3}},
				{"Q2", 6, []int{4, 5, 6}},
				{"Q3", 9, []int{7, 8, 9}},
				{"Q4", 12, []int{10, 11, 12}},
			}

			var cumulative int64 = 0
			for _, quarter := range quarters {
				var quarterSales int64
				
				startDate := time.Date(year, time.Month(quarter.months[0]), 1, 0, 0, 0, 0, time.UTC)
				endDate := time.Date(year, time.Month(quarter.months[len(quarter.months)-1]+1), 1, 0, 0, 0, 0, time.UTC)

				query := db.Model(&models.Sale{}).
					Where("created_at >= ? AND created_at < ?", startDate, endDate)
				
				if len(provinceUUIDs) > 0 {
					query = query.Where("province_uuid IN ?", provinceUUIDs)
				}

				query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&quarterSales)
				cumulative += quarterSales

				series.DataPoints = append(series.DataPoints, TimeValue{
					Period:     quarter.name,
					MonthIndex: quarter.index,
					Value:      cumulative,
				})
			}
		} else {
			// Monthly view
			monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
			var cumulative int64 = 0

			for monthNum := 1; monthNum <= 12; monthNum++ {
				startDate := time.Date(year, time.Month(monthNum), 1, 0, 0, 0, 0, time.UTC)
				endDate := time.Date(year, time.Month(monthNum+1), 1, 0, 0, 0, 0, time.UTC)

				query := db.Model(&models.Sale{}).
					Where("created_at >= ? AND created_at < ?", startDate, endDate)
				
				if len(provinceUUIDs) > 0 {
					query = query.Where("province_uuid IN ?", provinceUUIDs)
				}

				var monthSales int64
				query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&monthSales)
				cumulative += monthSales

				series.DataPoints = append(series.DataPoints, TimeValue{
					Period:     monthNames[monthNum-1],
					MonthIndex: monthNum,
					Value:      cumulative,
				})
			}
		}

		result = append(result, series)
	}

	return result, nil
}

// getAnnualSalesByProvince returns total annual sales for each province (grouped bar chart)
func getAnnualSalesByProvince(years []int, provinceUUIDs []string) ([]ProvinceAnnualData, error) {
	db := database.DB
	var result []ProvinceAnnualData

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	// For each province, get sales for each year
	for _, province := range provinces {
		provinceData := ProvinceAnnualData{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			YearlyData:   []YearSalesData{},
		}

		for _, year := range years {
			startDate := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)

			var totalSales int64
			db.Model(&models.Sale{}).
				Where("province_uuid = ? AND created_at >= ? AND created_at < ?", 
					province.UUID, startDate, endDate).
				Select("COALESCE(SUM(quantity), 0)").
				Row().
				Scan(&totalSales)

			provinceData.YearlyData = append(provinceData.YearlyData, YearSalesData{
				Year:       year,
				TotalSales: totalSales,
			})
		}

		result = append(result, provinceData)
	}

	return result, nil
}

// getYoYGrowthHeatmap returns YoY growth percentages for each province by period
func getYoYGrowthHeatmap(years []int, provinceUUIDs []string, viewBy string) ([]ProvinceYoYGrowth, error) {
	db := database.DB
	var result []ProvinceYoYGrowth

	// We need at least 2 years to calculate YoY growth
	if len(years) < 2 {
		return result, nil
	}

	// Sort years to get current and previous
	// Assume years are already sorted or sort them
	currentYear := years[0]
	previousYear := years[1]
	if len(years) > 1 && years[1] > years[0] {
		currentYear = years[1]
		previousYear = years[0]
	}

	// Get provinces
	var provinces []models.Province
	provinceQuery := db.Model(&models.Province{})
	if len(provinceUUIDs) > 0 {
		provinceQuery = provinceQuery.Where("uuid IN ?", provinceUUIDs)
	}
	if err := provinceQuery.Find(&provinces).Error; err != nil {
		return nil, err
	}

	for _, province := range provinces {
		provinceGrowth := ProvinceYoYGrowth{
			ProvinceUUID: province.UUID,
			ProvinceName: province.Name,
			PeriodGrowth: []PeriodGrowthData{},
		}

		if viewBy == "quarterly" {
			// Quarterly YoY growth
			quarters := []struct {
				name   string
				index  int
				months []int
			}{
				{"Q1", 3, []int{1, 2, 3}},
				{"Q2", 6, []int{4, 5, 6}},
				{"Q3", 9, []int{7, 8, 9}},
				{"Q4", 12, []int{10, 11, 12}},
			}

			for _, quarter := range quarters {
				// Current year quarter
				currentStart := time.Date(currentYear, time.Month(quarter.months[0]), 1, 0, 0, 0, 0, time.UTC)
				currentEnd := time.Date(currentYear, time.Month(quarter.months[len(quarter.months)-1]+1), 1, 0, 0, 0, 0, time.UTC)

				var currentSales int64
				db.Model(&models.Sale{}).
					Where("province_uuid = ? AND created_at >= ? AND created_at < ?", 
						province.UUID, currentStart, currentEnd).
					Select("COALESCE(SUM(quantity), 0)").
					Row().
					Scan(&currentSales)

				// Previous year quarter
				previousStart := time.Date(previousYear, time.Month(quarter.months[0]), 1, 0, 0, 0, 0, time.UTC)
				previousEnd := time.Date(previousYear, time.Month(quarter.months[len(quarter.months)-1]+1), 1, 0, 0, 0, 0, time.UTC)

				var previousSales int64
				db.Model(&models.Sale{}).
					Where("province_uuid = ? AND created_at >= ? AND created_at < ?", 
						province.UUID, previousStart, previousEnd).
					Select("COALESCE(SUM(quantity), 0)").
					Row().
					Scan(&previousSales)

				// Calculate growth %
				var growthPercent float64
				if previousSales > 0 {
					growthPercent = float64(currentSales-previousSales) / float64(previousSales) * 100
				}

				provinceGrowth.PeriodGrowth = append(provinceGrowth.PeriodGrowth, PeriodGrowthData{
					Period:        quarter.name,
					MonthIndex:    quarter.index,
					CurrentSales:  currentSales,
					PreviousSales: previousSales,
					GrowthPercent: growthPercent,
				})
			}
		} else {
			// Monthly YoY growth
			monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

			for monthNum := 1; monthNum <= 12; monthNum++ {
				// Current year month
				currentStart := time.Date(currentYear, time.Month(monthNum), 1, 0, 0, 0, 0, time.UTC)
				currentEnd := time.Date(currentYear, time.Month(monthNum+1), 1, 0, 0, 0, 0, time.UTC)

				var currentSales int64
				db.Model(&models.Sale{}).
					Where("province_uuid = ? AND created_at >= ? AND created_at < ?", 
						province.UUID, currentStart, currentEnd).
					Select("COALESCE(SUM(quantity), 0)").
					Row().
					Scan(&currentSales)

				// Previous year month
				previousStart := time.Date(previousYear, time.Month(monthNum), 1, 0, 0, 0, 0, time.UTC)
				previousEnd := time.Date(previousYear, time.Month(monthNum+1), 1, 0, 0, 0, 0, time.UTC)

				var previousSales int64
				db.Model(&models.Sale{}).
					Where("province_uuid = ? AND created_at >= ? AND created_at < ?", 
						province.UUID, previousStart, previousEnd).
					Select("COALESCE(SUM(quantity), 0)").
					Row().
					Scan(&previousSales)

				// Calculate growth %
				var growthPercent float64
				if previousSales > 0 {
					growthPercent = float64(currentSales-previousSales) / float64(previousSales) * 100
				}

				provinceGrowth.PeriodGrowth = append(provinceGrowth.PeriodGrowth, PeriodGrowthData{
					Period:        monthNames[monthNum-1],
					MonthIndex:    monthNum,
					CurrentSales:  currentSales,
					PreviousSales: previousSales,
					GrowthPercent: growthPercent,
				})
			}
		}

		result = append(result, provinceGrowth)
	}

	return result, nil
}