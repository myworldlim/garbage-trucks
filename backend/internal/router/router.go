//backend\internal\router\router.go
package router

import (
	"net/http"
	"github.com/gorilla/mux"
	"garbage_trucks/backend/internal/handlers"
	"garbage_trucks/backend/internal/middleware"
)

func NewRouter() *mux.Router {
	r := mux.NewRouter()

	// Middleware
	r.Use(middleware.CORS)

	// API Routes
	// Health check
	r.HandleFunc("/api/health", handlers.HealthHandler).Methods("GET")

	// Drivers
	r.HandleFunc("/api/drivers", handlers.GetDriversHandler).Methods("GET")
	r.HandleFunc("/api/drivers", handlers.CreateDriverHandler).Methods("POST")
	r.HandleFunc("/api/drivers/{id}", handlers.UpdateDriverHandler).Methods("PUT")
	r.HandleFunc("/api/drivers/{id}", handlers.DeleteDriverHandler).Methods("DELETE")

	// Points
	r.HandleFunc("/api/points", handlers.GetPointsHandler).Methods("GET")
	r.HandleFunc("/api/points", handlers.CreatePointHandler).Methods("POST")
	r.HandleFunc("/api/points/{id}", handlers.UpdatePointHandler).Methods("PUT")
	r.HandleFunc("/api/points/{id}", handlers.DeletePointHandler).Methods("DELETE")

	// Routes
	r.HandleFunc("/api/routes", handlers.GetRoutesHandler).Methods("GET")
	r.HandleFunc("/api/routes/status", handlers.UpdateRouteStatusHandler).Methods("POST", "PATCH")
	// r.HandleFunc("/api/test/status", handlers.TestUpdateRouteStatusHandler).Methods("POST", "OPTIONS")

	// НОВЫЕ МАРШРУТЫ для добавления/удаления точек
	r.HandleFunc("/api/routes/add", handlers.AddRoutePointHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/routes/remove", handlers.RemoveRoutePointHandler).Methods("DELETE", "OPTIONS")

	// OPTIONS для всех маршрутов (CORS preflight)
	r.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	return r
}