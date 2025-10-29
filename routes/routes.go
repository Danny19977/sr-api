package routes

import (
	notificationController "github.com/Danny19977/sr-api/controller/Notification"
	"github.com/Danny19977/sr-api/controller/auth"
	"github.com/Danny19977/sr-api/controller/country"
	"github.com/Danny19977/sr-api/controller/dashboard"
	monthController "github.com/Danny19977/sr-api/controller/month"
	"github.com/Danny19977/sr-api/controller/product"
	"github.com/Danny19977/sr-api/controller/province"
	Sale "github.com/Danny19977/sr-api/controller/sale"
	"github.com/Danny19977/sr-api/controller/user"
	"github.com/Danny19977/sr-api/controller/userlog"
	weekController "github.com/Danny19977/sr-api/controller/week"
	yearController "github.com/Danny19977/sr-api/controller/year"
	"github.com/Danny19977/sr-api/middlewares"
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {

	api := app.Group("/api")

	// Authentification controller - Public routes (no authentication required)
	a := api.Group("/auth")
	a.Post("/register", auth.Register)
	a.Post("/login", auth.Login)
	a.Post("/forgot-password", auth.Forgot)
	a.Post("/reset/:token", auth.ResetPassword)

	// Protected routes (authentication required)
	protected := api.Group("/auth")
	protected.Use(middlewares.IsAuthenticated)
	protected.Get("/user", auth.AuthUser)
	protected.Put("/profil/info", auth.UpdateInfo)
	protected.Put("/change-password", auth.ChangePassword)
	protected.Post("/logout", auth.Logout)

	// Users controller - Protected routes
	u := api.Group("/users")
	u.Use(middlewares.IsAuthenticated)
	u.Get("/all", user.GetAllUsers)
	u.Get("/all/paginate", user.GetPaginatedUsers)
	u.Get("/all/paginate/nosearch", user.GetPaginatedNoSerach)

	u.Get("/get/:uuid", user.GetUser)
	u.Post("/create", user.CreateUser)
	u.Put("/update/:uuid", user.UpdateUser)
	u.Delete("/delete/:uuid", user.DeleteUser)

	// UserLogs controller - Protected routes
	log := api.Group("/users-logs")
	log.Use(middlewares.IsAuthenticated)
	log.Get("/all", userlog.GetUserLogs)
	log.Get("/all/paginate", userlog.GetPaginatedUserLogs)
	log.Get("/all/paginate/:user_uuid", userlog.GetUserLogByID)
	log.Get("/get/:uuid", userlog.GetUserLog)
	log.Post("/create", userlog.CreateUserLog)
	log.Put("/update/:uuid", userlog.UpdateUserLog)
	log.Delete("/delete/:uuid", userlog.DeleteUserLog)

	// Countries controller - Protected routes
	co := api.Group("/countries")
	co.Use(middlewares.IsAuthenticated)
	co.Get("/all", country.GetAllCountry)
	co.Get("/all/paginate", country.GetPaginatedCountry)
	co.Get("/get/:uuid", country.GetCountry)
	co.Post("/create", country.CreateCountry)
	co.Put("/update/:uuid", country.UpdateCountry)
	co.Delete("/delete/:uuid", country.DeleteCountry)

	// Province controller - Protected routes
	prov := api.Group("/provinces")
	prov.Use(middlewares.IsAuthenticated)
	prov.Get("/all", province.GetAllProvinces)
	prov.Get("/all/paginate", province.GetPaginatedProvince)
	prov.Get("/all/paginate/:province_uuid", province.GetPaginatedASM)
	prov.Get("/all/country/:country_uuid", province.GetAllProvinceByCountry)
	prov.Get("/get/:uuid", province.GetProvince)
	prov.Post("/create", province.CreateProvince)
	prov.Put("/update/:uuid", province.UpdateProvince)
	prov.Delete("/delete/:uuid", province.DeleteProvince)

	// Products controller - Protected routes
	prod := api.Group("/products")
	prod.Use(middlewares.IsAuthenticated)
	prod.Get("/all", product.GetAllProducts)
	prod.Get("/all/paginate", product.GetPaginatedProducts)
	prod.Get("/get/:uuid", product.GetProduct)
	prod.Get("/get/name/:name", product.GetProductByName)
	prod.Post("/create", product.CreateProduct)
	prod.Put("/update/:uuid", product.UpdateProduct)
	prod.Delete("/delete/:uuid", product.DeleteProduct)

	// Dashboard controller - Protected routes - Sales area dashboard and year objectives
	dash := api.Group("/dashboard")
	dash.Use(middlewares.IsAuthenticated)
	dash.Get("/global-overview", dashboard.GetGlobalOverview)
	// dash.Get("/overall-summary", dashboard.GetOverallSummaryDashboard)
	// dash.Get("/comparison-summary", dashboard.GetComparisonSummary)

	// Sale controller - Protected routes
	sale := api.Group("/sales")
	sale.Use(middlewares.IsAuthenticated)
	sale.Get("/all", Sale.GetAllSale)
	sale.Get("/all/paginate", Sale.GetPaginatedSale)
	sale.Get("/all/province/:province_uuid", Sale.GetSaleByProvince)
	sale.Get("/get/:uuid", Sale.GetSale)
	sale.Post("/create", Sale.CreateSale)
	sale.Put("/update/:uuid", Sale.UpdateSale)
	sale.Delete("/delete/:uuid", Sale.DeleteSale)

	// Year controller - Protected routes
	yearGroup := api.Group("/years")
	yearGroup.Use(middlewares.IsAuthenticated)
	yearGroup.Get("/all", yearController.GetAllYears)
	yearGroup.Get("/all/paginate", yearController.GetPaginatedYear)
	yearGroup.Get("/get/:uuid", yearController.GetYear)
	yearGroup.Get("/get/year/:year", yearController.GetYearByYearString)
	yearGroup.Post("/create", yearController.CreateYear)
	yearGroup.Put("/update/:uuid", yearController.UpdateYear)
	yearGroup.Delete("/delete/:uuid", yearController.DeleteYear)

	// Month controller - Protected routes
	monthGroup := api.Group("/months")
	monthGroup.Use(middlewares.IsAuthenticated)
	monthGroup.Get("/all", monthController.GetAllMonths)
	monthGroup.Get("/all/paginate", monthController.GetPaginatedMonth)
	monthGroup.Get("/get/:uuid", monthController.GetMonth)
	monthGroup.Get("/get/month/:month", monthController.GetMonthByMonthString)
	monthGroup.Post("/create", monthController.CreateMonth)
	monthGroup.Put("/update/:uuid", monthController.UpdateMonth)
	monthGroup.Delete("/delete/:uuid", monthController.DeleteMonth)

	// Notification controller - Protected routes
	notificationGroup := api.Group("/notifications")
	notificationGroup.Use(middlewares.IsAuthenticated)
	notificationGroup.Get("/all", notificationController.GetAllNotifications)
	notificationGroup.Get("/all/paginate", notificationController.GetPaginatedNotification)
	notificationGroup.Get("/get/:uuid", notificationController.GetNotification)
	notificationGroup.Get("/get/title/:title", notificationController.GetNotificationByTitleString)
	notificationGroup.Post("/create", notificationController.CreateNotification)
	notificationGroup.Put("/update/:uuid", notificationController.UpdateNotification)
	notificationGroup.Delete("/delete/:uuid", notificationController.DeleteNotification)

	// Week controller - Protected routes
	weekGroup := api.Group("/weeks")
	weekGroup.Use(middlewares.IsAuthenticated)
	weekGroup.Get("/all", weekController.GetAllWeeks)
	weekGroup.Get("/all/paginate", weekController.GetPaginatedWeek)
	weekGroup.Get("/get/:uuid", weekController.GetWeek)
	weekGroup.Get("/get/week/:week", weekController.GetWeekByWeekString)
	weekGroup.Post("/create", weekController.CreateWeek)
	weekGroup.Put("/update/:uuid", weekController.UpdateWeek)
	weekGroup.Delete("/delete/:uuid", weekController.DeleteWeek)
}
