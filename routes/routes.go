package routes

import (
	"github.com/Danny19977/mypg-api/controller/area"
	"github.com/Danny19977/mypg-api/controller/auth"
	"github.com/Danny19977/mypg-api/controller/country"
	"github.com/Danny19977/mypg-api/controller/form"
	"github.com/Danny19977/mypg-api/controller/formitem"
	"github.com/Danny19977/mypg-api/controller/manager"
	"github.com/Danny19977/mypg-api/controller/province"
	"github.com/Danny19977/mypg-api/controller/user"
	"github.com/Danny19977/mypg-api/controller/userlog"
	"github.com/Danny19977/mypg-api/controller/visite"
	"github.com/Danny19977/mypg-api/controller/visitedata"
	"github.com/Danny19977/mypg-api/controller/visiteharder"
	"github.com/Danny19977/mypg-api/middlewares"
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

	// Public Form routes (no authentication required)
	public := api.Group("/public")
	public.Get("/forms/:uuid", form.GetForm)                                             // Get form for filling out
	public.Get("/forms/:formUuid/items", formitem.GetFormItemsByForm)                    // Get form items for display
	public.Get("/form-items/:formItemUuid/options", visite.GetVisitesByFormItem)         // Get options for select/radio/checkbox
	public.Post("/form-submissions", visiteharder.CreateVisiteHarder)                    // Submit form response
	public.Post("/form-responses", visitedata.CreateVisiteData)                          // Submit individual field responses
	public.Post("/form-responses/bulk", visitedata.CreateBulkVisiteData)                 // Submit multiple field responses at once
	public.Get("/form-items/:formItemUuid/responses", visitedata.GetResponsesByFormItem) // Get responses grouped by form item
	public.Put("/form-responses/update-gps/:uuid", visitedata.UpdateVisiteDataGPS)       // Update GPS coordinates for public submissions

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

	// u.Get("/all/:id", user.GetUserByID)
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
	// co.Get("/all/dropdown", country.GetCountryDropdown)
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
	// prov.Get("/all/:id", province.GetProvinceByID)
	prov.Get("/get/:uuid", province.GetProvince)
	prov.Post("/create", province.CreateProvince)
	prov.Put("/update/:uuid", province.UpdateProvince)
	prov.Delete("/delete/:uuid", province.DeleteProvince)

	// Areas controller - Protected routes
	ar := api.Group("/areas")
	ar.Use(middlewares.IsAuthenticated)
	ar.Get("/all", area.GetAllAreas)
	ar.Get("/all/province_uuid", area.GetAllAreasByProvinceUUID)
	ar.Get("/all/province/:province_uuid", area.GetAllAreasByProvinceUUID)
	ar.Get("/all/paginate", area.GetPaginatedAreas)
	ar.Get("/all/paginate/:area_uuid", area.GetAreaBySups)
	ar.Get("/all/:uuid", area.GetAreaByUUID)
	ar.Get("/all-area/:uuid", area.GetSupAreaByUUID)
	ar.Post("/create", area.CreateArea)
	ar.Get("/get/:uuid", area.GetArea)
	ar.Put("/update/:uuid", area.UpdateArea)
	ar.Delete("/delete/:uuid", area.DeleteArea)

	// Manager controller - Protected routes
	ma := api.Group("/managers")
	ma.Use(middlewares.IsAuthenticated)
	ma.Get("/all", manager.GetAllManagers)
	ma.Get("/all/paginate", manager.GetPaginatedManager)
	ma.Get("/get/:uuid", manager.GetManager)
	// ma.Get("/all/:id", manager.GetManagerByID)
	ma.Post("/create", manager.CreateManager)
	ma.Put("/update/:uuid", manager.UpdateManager)
	ma.Delete("/delete/:uuid", manager.DeleteManager)

	// Dashboard controller - Protected routes
	dash := api.Group("/dashboard")
	dash.Use(middlewares.IsAuthenticated)

	// Visite controller - Protected routes
	vi := api.Group("/visites")
	vi.Use(middlewares.IsAuthenticated)
	vi.Get("/all", visite.GetAllVisites)
	vi.Get("/all/paginate", visite.GetPaginatedVisites)
	vi.Get("/get/:uuid", visite.GetVisite)
	vi.Get("/form-item/:formItemUuid", visite.GetVisitesByFormItem)
	vi.Post("/create", visite.CreateVisite)
	vi.Put("/update/:uuid", visite.UpdateVisite)
	vi.Delete("/delete/:uuid", visite.DeleteVisite)

	// Form controller - Protected routes
	fo := api.Group("/forms")
	fo.Use(middlewares.IsAuthenticated)
	fo.Get("/all", form.GetAllForms)
	fo.Get("/all/paginate", form.GetPaginatedForms)
	fo.Get("/get/:uuid", form.GetForm)
	fo.Get("/user/:userUuid", form.GetFormsByUser)
	fo.Post("/create", form.CreateForm)
	fo.Put("/update/:uuid", form.UpdateForm)
	fo.Delete("/delete/:uuid", form.DeleteForm)

	// FormItem controller - Protected routes
	fi := api.Group("/form-items")
	fi.Use(middlewares.IsAuthenticated)
	fi.Get("/all", formitem.GetAllFormItems)
	fi.Get("/all/paginate", formitem.GetPaginatedFormItems)
	fi.Get("/get/:uuid", formitem.GetFormItem)
	fi.Get("/form/:formUuid", formitem.GetFormItemsByForm)
	fi.Post("/create", formitem.CreateFormItem)
	fi.Put("/update/:uuid", formitem.UpdateFormItem)
	fi.Delete("/delete/:uuid", formitem.DeleteFormItem)

	// VisiteHarder (Form Submissions) controller - Protected routes
	vh := api.Group("/form-submissions")
	vh.Use(middlewares.IsAuthenticated)
	vh.Get("/all", visiteharder.GetAllVisiteHarders)
	vh.Get("/all/paginate", visiteharder.GetPaginatedVisiteHarders)
	vh.Get("/get/:uuid", visiteharder.GetVisiteHarder)
	vh.Get("/form/:formUuid", visiteharder.GetVisiteHardersByForm)
	vh.Get("/user/:userUuid", visiteharder.GetVisiteHardersByUser)
	vh.Post("/create", visiteharder.CreateVisiteHarder)
	vh.Put("/update/:uuid", visiteharder.UpdateVisiteHarder)
	vh.Delete("/delete/:uuid", visiteharder.DeleteVisiteHarder)

	// VisiteData (Form Responses) controller - Protected routes
	vd := api.Group("/form-responses")
	vd.Use(middlewares.IsAuthenticated)
	vd.Get("/all", visitedata.GetAllVisiteDatas)
	vd.Get("/all/paginate", visitedata.GetPaginatedVisiteDatas)
	vd.Get("/get/:uuid", visitedata.GetVisiteData)
	vd.Get("/submission/:submissionUuid", visitedata.GetVisiteDatasBySubmission)
	vd.Get("/form-item/:formItemUuid", visitedata.GetVisiteDatasByFormItem)
	vd.Get("/user/:userUuid", visitedata.GetVisiteDatasByUser)
	vd.Post("/create", visitedata.CreateVisiteData)
	vd.Put("/update/:uuid", visitedata.UpdateVisiteData)
	vd.Put("/update-gps/:uuid", visitedata.UpdateVisiteDataGPS) // New GPS-specific update endpoint
	vd.Delete("/delete/:uuid", visitedata.DeleteVisiteData)

	// Additional VisiteData routes with different path structure for frontend compatibility
	visiteDataGroup := api.Group("/visite-data")
	visiteDataGroup.Use(middlewares.IsAuthenticated)
	visiteDataGroup.Get("/map-markers", visitedata.GetMapMarkers)
	visiteDataGroup.Get("/map-images", visitedata.GetVisiteDataImagesForMap)

	// Sales controller - Protected routes
	sales := api.Group("/sales")
	sales.Use(middlewares.IsAuthenticated)

	// Sales Country routes
	sales.Get("/all/country/:uuid", country.GetCountry)
	sales.Get("/all/countries", country.GetAllCountry)
	sales.Get("/all/countries/paginate", country.GetPaginatedCountry)

	// Sales Province routes
	sales.Get("/all/province/:uuid", province.GetProvince)
	sales.Get("/all/provinces", province.GetAllProvinces)
	sales.Get("/all/provinces/paginate", province.GetPaginatedProvince)
	sales.Get("/all/provinces/country/:country_uuid", province.GetAllProvinceByCountry)

	// Sales Area routes
	sales.Get("/all/area/:uuid", area.GetArea)
	sales.Get("/all/areas", area.GetAllAreas)
	sales.Get("/all/areas/paginate", area.GetPaginatedAreas)
	sales.Get("/all/areas/province/:province_uuid", area.GetAllAreasByProvinceUUID)

	// Sales Manager routes
	sales.Get("/all/manager/:uuid", manager.GetManager)
	sales.Get("/all/managers", manager.GetAllManagers)
	sales.Get("/all/managers/paginate", manager.GetPaginatedManager)

	// Sales User routes
	sales.Get("/all/user/:uuid", user.GetUser)
	sales.Get("/all/users", user.GetAllUsers)
	sales.Get("/all/users/paginate", user.GetPaginatedUsers)
}
