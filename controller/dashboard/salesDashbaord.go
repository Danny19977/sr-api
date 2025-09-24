package dashboard

import (
	"fmt"
	"strconv"
	"time"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Stock Sales Analytics Dashboard - Focused on meaningful sales insights

// SalesAnalytics represents the main sales analytics structure
type SalesAnalytics struct {
	Period        string               `json:"period"`         // daily, weekly, monthly
	DateRange     DateRange            `json:"date_range"`     // period covered
	StockMovement StockMovementSummary `json:"stock_movement"` // overall stock movement
	ProductSales  []ProductSalesDetail `json:"product_sales"`  // detailed product performance
	SalesPersons  []SalesPersonDetail  `json:"sales_persons"`  // who sold what and when
	TrendAnalysis TrendAnalysis        `json:"trend_analysis"` // period-over-period trends
	TopPerformers TopPerformers        `json:"top_performers"` // best performing entities
}

type DateRange struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	Days      int    `json:"days"`
}

type StockMovementSummary struct {
	TotalQuantitySold      int64   `json:"total_quantity_sold"`
	TotalSalesTransactions int64   `json:"total_sales_transactions"`
	AverageQuantityPerSale float64 `json:"average_quantity_per_sale"`
	DailyAverageQuantity   float64 `json:"daily_average_quantity"`
	PeakSalesDate          string  `json:"peak_sales_date"`
	PeakSalesQuantity      int64   `json:"peak_sales_quantity"`
}

type ProductSalesDetail struct {
	ProductUUID       string              `json:"product_uuid"`
	ProductName       string              `json:"product_name"`
	TotalQuantitySold int64               `json:"total_quantity_sold"`
	SalesCount        int64               `json:"sales_count"`
	AveragePerSale    float64             `json:"average_per_sale"`
	FirstSaleDate     string              `json:"first_sale_date"`
	LastSaleDate      string              `json:"last_sale_date"`
	SalesByPeriod     []PeriodSalesData   `json:"sales_by_period"`
	TopSellers        []ProductSellerInfo `json:"top_sellers"`
}

type PeriodSalesData struct {
	Period      string `json:"period"`       // 2025-09-24, 2025-W39, 2025-09
	PeriodLabel string `json:"period_label"` // Sept 24, Week 39, September
	Quantity    int64  `json:"quantity"`
	SalesCount  int64  `json:"sales_count"`
}

type ProductSellerInfo struct {
	UserUUID     string `json:"user_uuid"`
	UserName     string `json:"user_name"`
	Quantity     int64  `json:"quantity"`
	SalesCount   int64  `json:"sales_count"`
	LastSaleDate string `json:"last_sale_date"`
}

type SalesPersonDetail struct {
	UserUUID        string               `json:"user_uuid"`
	UserName        string               `json:"user_name"`
	UserTitle       string               `json:"user_title"`
	TotalQuantity   int64                `json:"total_quantity"`
	TotalSales      int64                `json:"total_sales"`
	AveragePerDay   float64              `json:"average_per_day"`
	ProductsSold    []SalesPersonProduct `json:"products_sold"`
	SalesByPeriod   []PeriodSalesData    `json:"sales_by_period"`
	PerformanceRank int                  `json:"performance_rank"`
}

type SalesPersonProduct struct {
	ProductUUID  string `json:"product_uuid"`
	ProductName  string `json:"product_name"`
	Quantity     int64  `json:"quantity"`
	SalesCount   int64  `json:"sales_count"`
	LastSaleDate string `json:"last_sale_date"`
}

type TrendAnalysis struct {
	CurrentPeriodTotal  int64   `json:"current_period_total"`
	PreviousPeriodTotal int64   `json:"previous_period_total"`
	GrowthPercentage    float64 `json:"growth_percentage"`
	TrendDirection      string  `json:"trend_direction"` // up, down, stable
	BestPerformingDay   string  `json:"best_performing_day"`
	WorstPerformingDay  string  `json:"worst_performing_day"`
}

type TopPerformers struct {
	TopProduct       ProductPerformance  `json:"top_product"`
	TopSalesPerson   PersonPerformance   `json:"top_sales_person"`
	TopProvince      ProvincePerformance `json:"top_province"`
	MostActivePeriod PeriodPerformance   `json:"most_active_period"`
}

type ProductPerformance struct {
	ProductUUID   string `json:"product_uuid"`
	ProductName   string `json:"product_name"`
	TotalQuantity int64  `json:"total_quantity"`
	SalesCount    int64  `json:"sales_count"`
}

type PersonPerformance struct {
	UserUUID      string `json:"user_uuid"`
	UserName      string `json:"user_name"`
	TotalQuantity int64  `json:"total_quantity"`
	SalesCount    int64  `json:"sales_count"`
}

type ProvincePerformance struct {
	ProvinceUUID  string `json:"province_uuid"`
	ProvinceName  string `json:"province_name"`
	TotalQuantity int64  `json:"total_quantity"`
	SalesCount    int64  `json:"sales_count"`
}

type PeriodPerformance struct {
	Period        string `json:"period"`
	PeriodLabel   string `json:"period_label"`
	TotalQuantity int64  `json:"total_quantity"`
	SalesCount    int64  `json:"sales_count"`
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

// Main Sales Analytics Dashboard - Focused on stock sales insights
func GetSalesAnalytics(c *fiber.Ctx) error {
	db := database.DB

	// Get parameters
	period := c.Query("period", "daily") // daily, weekly, monthly
	year := c.Query("year", "")          // specific year, defaults to current year
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")

	// Validate period
	if period != "daily" && period != "weekly" && period != "monthly" {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid period. Use 'daily', 'weekly', or 'monthly'",
		})
	}

	// Set year
	var targetYear int
	if year != "" {
		var err error
		targetYear, err = strconv.Atoi(year)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"status":  "error",
				"message": "Invalid year format",
			})
		}
	} else {
		targetYear = time.Now().Year()
	}

	// Calculate date range for the entire year
	startDate := time.Date(targetYear, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(targetYear+1, 1, 1, 0, 0, 0, 0, time.UTC)

	// Build base query
	baseQuery := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", startDate, endDate)

	if countryUUID != "" {
		baseQuery = baseQuery.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		baseQuery = baseQuery.Where("province_uuid = ?", provinceUUID)
	}

	// Get analytics data
	dateRange := DateRange{
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.AddDate(0, 0, -1).Format("2006-01-02"),
		Days:      int(endDate.Sub(startDate).Hours() / 24),
	}

	stockMovement := getStockMovementSummary(baseQuery, startDate, endDate)
	productSales := getProductSalesDetails(db, baseQuery, period, startDate, endDate)
	salesPersons := getSalesPersonDetails(db, baseQuery, period, startDate, endDate)
	trendAnalysis := getTrendAnalysis(db, baseQuery, period, startDate, endDate)
	topPerformers := getTopPerformers(baseQuery)

	analytics := SalesAnalytics{
		Period:        period,
		DateRange:     dateRange,
		StockMovement: stockMovement,
		ProductSales:  productSales,
		SalesPersons:  salesPersons,
		TrendAnalysis: trendAnalysis,
		TopPerformers: topPerformers,
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Sales analytics for %s period in year %d", period, targetYear),
		"data":    analytics,
		"filters": fiber.Map{
			"period":        period,
			"year":          targetYear,
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
}

// Get stock movement summary
func getStockMovementSummary(query *gorm.DB, startDate, endDate time.Time) StockMovementSummary {
	var totalQuantity, totalSales int64
	var avgQuantityPerSale float64

	query.Count(&totalSales)
	query.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&totalQuantity)

	if totalSales > 0 {
		avgQuantityPerSale = float64(totalQuantity) / float64(totalSales)
	}

	days := int(endDate.Sub(startDate).Hours() / 24)
	dailyAvg := float64(totalQuantity) / float64(days)

	// Get peak sales date
	var peakDate time.Time
	var peakQuantity int64

	query.Select("DATE(created_at) as sale_date, SUM(quantity) as daily_total").
		Group("DATE(created_at)").
		Order("daily_total DESC").
		Limit(1).
		Row().Scan(&peakDate, &peakQuantity)

	return StockMovementSummary{
		TotalQuantitySold:      totalQuantity,
		TotalSalesTransactions: totalSales,
		AverageQuantityPerSale: avgQuantityPerSale,
		DailyAverageQuantity:   dailyAvg,
		PeakSalesDate:          peakDate.Format("2006-01-02"),
		PeakSalesQuantity:      peakQuantity,
	}
}

// Get detailed product sales information
func getProductSalesDetails(db *gorm.DB, baseQuery *gorm.DB, period string, startDate, endDate time.Time) []ProductSalesDetail {
	var products []ProductSalesDetail

	// Get all products with sales in the period
	rows, err := baseQuery.
		Select("product_uuid, products.name as product_name, SUM(quantity) as total_quantity, COUNT(*) as sales_count, MIN(sales.created_at) as first_sale, MAX(sales.created_at) as last_sale").
		Joins("JOIN products ON sales.product_uuid = products.uuid").
		Group("product_uuid, products.name").
		Order("total_quantity DESC").
		Rows()

	if err != nil {
		return products
	}
	defer rows.Close()

	for rows.Next() {
		var product ProductSalesDetail
		var firstSale, lastSale time.Time

		rows.Scan(&product.ProductUUID, &product.ProductName, &product.TotalQuantitySold,
			&product.SalesCount, &firstSale, &lastSale)

		product.FirstSaleDate = firstSale.Format("2006-01-02 15:04")
		product.LastSaleDate = lastSale.Format("2006-01-02 15:04")
		product.AveragePerSale = float64(product.TotalQuantitySold) / float64(product.SalesCount)

		// Get sales by period for this product
		product.SalesByPeriod = getProductSalesByPeriod(db, product.ProductUUID, period, startDate, endDate)

		// Get top sellers for this product
		product.TopSellers = getTopSellersForProduct(db, product.ProductUUID, startDate, endDate)

		products = append(products, product)
	}

	return products
}

// Get sales person details
func getSalesPersonDetails(db *gorm.DB, baseQuery *gorm.DB, period string, startDate, endDate time.Time) []SalesPersonDetail {
	var salesPersons []SalesPersonDetail

	rows, err := baseQuery.
		Select("user_uuid, users.fullname as user_name, users.title as user_title, SUM(quantity) as total_quantity, COUNT(*) as total_sales").
		Joins("JOIN users ON sales.user_uuid = users.uuid").
		Group("user_uuid, users.fullname, users.title").
		Order("total_quantity DESC").
		Rows()

	if err != nil {
		return salesPersons
	}
	defer rows.Close()

	rank := 1
	days := int(endDate.Sub(startDate).Hours() / 24)

	for rows.Next() {
		var person SalesPersonDetail

		rows.Scan(&person.UserUUID, &person.UserName, &person.UserTitle,
			&person.TotalQuantity, &person.TotalSales)

		person.AveragePerDay = float64(person.TotalQuantity) / float64(days)
		person.PerformanceRank = rank

		// Get products sold by this person
		person.ProductsSold = getProductsSoldByPerson(db, person.UserUUID, startDate, endDate)

		// Get sales by period for this person
		person.SalesByPeriod = getPersonSalesByPeriod(db, person.UserUUID, period, startDate, endDate)

		salesPersons = append(salesPersons, person)
		rank++
	}

	return salesPersons
}

// Get trend analysis
func getTrendAnalysis(db *gorm.DB, baseQuery *gorm.DB, period string, startDate, endDate time.Time) TrendAnalysis {
	var currentTotal int64
	baseQuery.Select("COALESCE(SUM(quantity), 0)").Row().Scan(&currentTotal)

	// Get previous period for comparison
	duration := endDate.Sub(startDate)
	prevStartDate := startDate.Add(-duration)
	prevEndDate := startDate

	var prevTotal int64
	db.Model(&models.Sale{}).
		Where("created_at >= ? AND created_at < ?", prevStartDate, prevEndDate).
		Select("COALESCE(SUM(quantity), 0)").Row().Scan(&prevTotal)

	var growthPercentage float64
	var trendDirection string

	if prevTotal > 0 {
		growthPercentage = ((float64(currentTotal) - float64(prevTotal)) / float64(prevTotal)) * 100
	}

	switch {
	case growthPercentage > 5:
		trendDirection = "up"
	case growthPercentage < -5:
		trendDirection = "down"
	default:
		trendDirection = "stable"
	}

	// Get best and worst performing days
	var bestDay, worstDay time.Time

	baseQuery.Select("DATE(created_at) as sale_date, SUM(quantity) as daily_total").
		Group("DATE(created_at)").
		Order("daily_total DESC").
		Limit(1).
		Row().Scan(&bestDay)

	baseQuery.Select("DATE(created_at) as sale_date, SUM(quantity) as daily_total").
		Group("DATE(created_at)").
		Order("daily_total ASC").
		Limit(1).
		Row().Scan(&worstDay)

	return TrendAnalysis{
		CurrentPeriodTotal:  currentTotal,
		PreviousPeriodTotal: prevTotal,
		GrowthPercentage:    growthPercentage,
		TrendDirection:      trendDirection,
		BestPerformingDay:   bestDay.Format("2006-01-02"),
		WorstPerformingDay:  worstDay.Format("2006-01-02"),
	}
}

// Get top performers
func getTopPerformers(baseQuery *gorm.DB) TopPerformers {
	var topProduct ProductPerformance
	var topPerson PersonPerformance
	var topProvince ProvincePerformance

	// Top product
	baseQuery.Select("product_uuid, products.name as product_name, SUM(quantity) as total_quantity, COUNT(*) as sales_count").
		Joins("JOIN products ON sales.product_uuid = products.uuid").
		Group("product_uuid, products.name").
		Order("total_quantity DESC").
		Limit(1).
		Row().Scan(&topProduct.ProductUUID, &topProduct.ProductName, &topProduct.TotalQuantity, &topProduct.SalesCount)

	// Top sales person
	baseQuery.Select("user_uuid, users.fullname as user_name, SUM(quantity) as total_quantity, COUNT(*) as sales_count").
		Joins("JOIN users ON sales.user_uuid = users.uuid").
		Group("user_uuid, users.fullname").
		Order("total_quantity DESC").
		Limit(1).
		Row().Scan(&topPerson.UserUUID, &topPerson.UserName, &topPerson.TotalQuantity, &topPerson.SalesCount)

	// Top province
	baseQuery.Select("province_uuid, provinces.name as province_name, SUM(quantity) as total_quantity, COUNT(*) as sales_count").
		Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
		Group("province_uuid, provinces.name").
		Order("total_quantity DESC").
		Limit(1).
		Row().Scan(&topProvince.ProvinceUUID, &topProvince.ProvinceName, &topProvince.TotalQuantity, &topProvince.SalesCount)

	return TopPerformers{
		TopProduct:     topProduct,
		TopSalesPerson: topPerson,
		TopProvince:    topProvince,
	}
}

// Helper functions for detailed data

func getProductSalesByPeriod(db *gorm.DB, productUUID, period string, startDate, endDate time.Time) []PeriodSalesData {
	var periods []PeriodSalesData

	var groupBy, selectFormat string
	switch period {
	case "daily":
		groupBy = "DATE(created_at)"
		selectFormat = "DATE(created_at) as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	case "weekly":
		groupBy = "YEARWEEK(created_at, 1)"
		selectFormat = "YEARWEEK(created_at, 1) as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	case "monthly":
		groupBy = "DATE_FORMAT(created_at, '%Y-%m')"
		selectFormat = "DATE_FORMAT(created_at, '%Y-%m') as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	}

	rows, err := db.Model(&models.Sale{}).
		Select(selectFormat).
		Where("product_uuid = ? AND created_at >= ? AND created_at < ?", productUUID, startDate, endDate).
		Group(groupBy).
		Order("period").
		Rows()

	if err != nil {
		return periods
	}
	defer rows.Close()

	for rows.Next() {
		var p PeriodSalesData
		rows.Scan(&p.Period, &p.Quantity, &p.SalesCount)
		p.PeriodLabel = formatPeriodLabel(p.Period, period)
		periods = append(periods, p)
	}

	return periods
}

func getTopSellersForProduct(db *gorm.DB, productUUID string, startDate, endDate time.Time) []ProductSellerInfo {
	var sellers []ProductSellerInfo

	rows, err := db.Model(&models.Sale{}).
		Select("user_uuid, users.fullname as user_name, SUM(quantity) as quantity, COUNT(*) as sales_count, MAX(sales.created_at) as last_sale").
		Joins("JOIN users ON sales.user_uuid = users.uuid").
		Where("product_uuid = ? AND sales.created_at >= ? AND sales.created_at < ?", productUUID, startDate, endDate).
		Group("user_uuid, users.fullname").
		Order("quantity DESC").
		Limit(5).
		Rows()

	if err != nil {
		return sellers
	}
	defer rows.Close()

	for rows.Next() {
		var seller ProductSellerInfo
		var lastSale time.Time
		rows.Scan(&seller.UserUUID, &seller.UserName, &seller.Quantity, &seller.SalesCount, &lastSale)
		seller.LastSaleDate = lastSale.Format("2006-01-02 15:04")
		sellers = append(sellers, seller)
	}

	return sellers
}

func getProductsSoldByPerson(db *gorm.DB, userUUID string, startDate, endDate time.Time) []SalesPersonProduct {
	var products []SalesPersonProduct

	rows, err := db.Model(&models.Sale{}).
		Select("product_uuid, products.name as product_name, SUM(quantity) as quantity, COUNT(*) as sales_count, MAX(sales.created_at) as last_sale").
		Joins("JOIN products ON sales.product_uuid = products.uuid").
		Where("user_uuid = ? AND sales.created_at >= ? AND sales.created_at < ?", userUUID, startDate, endDate).
		Group("product_uuid, products.name").
		Order("quantity DESC").
		Rows()

	if err != nil {
		return products
	}
	defer rows.Close()

	for rows.Next() {
		var product SalesPersonProduct
		var lastSale time.Time
		rows.Scan(&product.ProductUUID, &product.ProductName, &product.Quantity, &product.SalesCount, &lastSale)
		product.LastSaleDate = lastSale.Format("2006-01-02 15:04")
		products = append(products, product)
	}

	return products
}

func getPersonSalesByPeriod(db *gorm.DB, userUUID, period string, startDate, endDate time.Time) []PeriodSalesData {
	var periods []PeriodSalesData

	var groupBy, selectFormat string
	switch period {
	case "daily":
		groupBy = "DATE(created_at)"
		selectFormat = "DATE(created_at) as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	case "weekly":
		groupBy = "YEARWEEK(created_at, 1)"
		selectFormat = "YEARWEEK(created_at, 1) as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	case "monthly":
		groupBy = "DATE_FORMAT(created_at, '%Y-%m')"
		selectFormat = "DATE_FORMAT(created_at, '%Y-%m') as period, SUM(quantity) as quantity, COUNT(*) as sales_count"
	}

	rows, err := db.Model(&models.Sale{}).
		Select(selectFormat).
		Where("user_uuid = ? AND created_at >= ? AND created_at < ?", userUUID, startDate, endDate).
		Group(groupBy).
		Order("period").
		Rows()

	if err != nil {
		return periods
	}
	defer rows.Close()

	for rows.Next() {
		var p PeriodSalesData
		rows.Scan(&p.Period, &p.Quantity, &p.SalesCount)
		p.PeriodLabel = formatPeriodLabel(p.Period, period)
		periods = append(periods, p)
	}

	return periods
}

func formatPeriodLabel(period, periodType string) string {
	switch periodType {
	case "daily":
		if t, err := time.Parse("2006-01-02", period); err == nil {
			return t.Format("Jan 02")
		}
	case "weekly":
		return fmt.Sprintf("Week %s", period[4:])
	case "monthly":
		if t, err := time.Parse("2006-01", period); err == nil {
			return t.Format("January")
		}
	}
	return period
}

// Get Stock Performance Summary - Monthly breakdown for a year
func GetStockPerformanceSummary(c *fiber.Ctx) error {
	db := database.DB

	year := c.Query("year", strconv.Itoa(time.Now().Year()))
	countryUUID := c.Query("country_uuid", "")
	provinceUUID := c.Query("province_uuid", "")

	targetYear, err := strconv.Atoi(year)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid year format",
		})
	}

	startDate := time.Date(targetYear, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(targetYear+1, 1, 1, 0, 0, 0, 0, time.UTC)

	query := db.Model(&models.Sale{}).Where("created_at >= ? AND created_at < ?", startDate, endDate)

	if countryUUID != "" {
		query = query.Joins("JOIN provinces ON sales.province_uuid = provinces.uuid").
			Where("provinces.country_uuid = ?", countryUUID)
	}

	if provinceUUID != "" {
		query = query.Where("province_uuid = ?", provinceUUID)
	}

	// Get monthly breakdown
	monthlyData := []map[string]interface{}{}

	for month := 1; month <= 12; month++ {
		monthStart := time.Date(targetYear, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
		monthEnd := monthStart.AddDate(0, 1, 0)

		var monthlyQuantity, monthlySales int64

		query.Where("created_at >= ? AND created_at < ?", monthStart, monthEnd).
			Count(&monthlySales)
		query.Where("created_at >= ? AND created_at < ?", monthStart, monthEnd).
			Select("COALESCE(SUM(quantity), 0)").Row().Scan(&monthlyQuantity)

		monthlyData = append(monthlyData, map[string]interface{}{
			"month":         month,
			"month_name":    monthStart.Format("January"),
			"quantity_sold": monthlyQuantity,
			"sales_count":   monthlySales,
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Stock performance summary for year %d", targetYear),
		"data": fiber.Map{
			"year":         targetYear,
			"monthly_data": monthlyData,
		},
		"filters": fiber.Map{
			"year":          targetYear,
			"country_uuid":  countryUUID,
			"province_uuid": provinceUUID,
		},
	})
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

		// Simple daily summary without time slots for now

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
