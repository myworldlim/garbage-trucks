package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"garbage_trucks/backend/internal/models"
)

func GetRoutesHandler(w http.ResponseWriter, r *http.Request) {
	driverIDStr := r.URL.Query().Get("driver_id")
	pointIDStr := r.URL.Query().Get("point_id")

	if driverIDStr != "" {
		// Получаем маршруты по водителю
		driverID, err := strconv.Atoi(driverIDStr)
		if err != nil {
			http.Error(w, "driver_id должен быть числом", http.StatusBadRequest)
			return
		}

		// Получаем информацию о водителе
		driver, err := models.GetDriverByID(context.Background(), driverID)
		if err != nil {
			http.Error(w, "Ошибка получения водителя", http.StatusInternalServerError)
			return
		}

		routes, err := models.GetRoutesByDriverID(context.Background(), driverID)
		if err != nil {
			http.Error(w, "Ошибка получения маршрута", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"driver": driver,
			"routes": routes,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
		}
	} else if pointIDStr != "" {
		// Получаем маршруты по точке
		pointID, err := strconv.Atoi(pointIDStr)
		if err != nil {
			http.Error(w, "point_id должен быть числом", http.StatusBadRequest)
			return
		}

		routes, err := models.GetRoutesByPointID(context.Background(), pointID)
		if err != nil {
			http.Error(w, "Ошибка получения маршрутов", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(routes); err != nil {
			http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
		}
	} else {
		http.Error(w, "driver_id или point_id обязателен", http.StatusBadRequest)
	}
}

func UpdateRouteStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
		return
	}

	routeIDStr := r.URL.Query().Get("route_id")
	status := r.URL.Query().Get("status")

	if routeIDStr == "" || status == "" {
		http.Error(w, "route_id и status обязательны", http.StatusBadRequest)
		return
	}

	routeID, err := strconv.Atoi(routeIDStr)
	if err != nil {
		http.Error(w, "route_id должен быть числом", http.StatusBadRequest)
		return
	}

	err = models.UpdateRouteStatus(context.Background(), routeID, status)
	if err != nil {
		http.Error(w, "Ошибка обновления статуса", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "success"}); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}