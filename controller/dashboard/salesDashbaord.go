package dashboard

import (
	"net/http"

	"github.com/Danny19977/sr-api/database"
	"github.com/Danny19977/sr-api/models"
	"github.com/gofiber/fiber/v2"
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
