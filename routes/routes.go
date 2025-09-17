package routes

import (
	"github.com/Danny19977/sr-api/controller/auth"
	"github.com/Danny19977/sr-api/controller/country"
	"github.com/Danny19977/sr-api/controller/province"
	"github.com/Danny19977/sr-api/controller/user"
	"github.com/Danny19977/sr-api/controller/userlog"
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

	// Dashboard controller - Protected routes
	dash := api.Group("/dashboard")
	dash.Use(middlewares.IsAuthenticated)

}
