package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	
	"garbage_trucks/backend/internal/models"
)

func GetRoutesHandler(w http.ResponseWriter, r *http.Request) {
	driverIDStr := r.URL.Query().Get("driver_id")
	pointIDStr := r.URL.Query().Get("point_id")

	log.Printf("GetRoutesHandler: driver_id=%s, point_id=%s", driverIDStr, pointIDStr)

	if driverIDStr != "" {
		driverID, err := strconv.Atoi(driverIDStr)
		if err != nil {
			log.Printf("GetRoutesHandler: invalid driver_id: %s", driverIDStr)
			http.Error(w, "driver_id должен быть числом", http.StatusBadRequest)
			return
		}

		driver, err := models.GetDriverByID(r.Context(), driverID)
		if err != nil {
			log.Printf("GetRoutesHandler: error getting driver: %v", err)
			http.Error(w, "Ошибка получения водителя: "+err.Error(), http.StatusInternalServerError)
			return
		}

		routes, err := models.GetRoutesByDriverID(r.Context(), driverID)
		if err != nil {
			log.Printf("GetRoutesHandler: error getting routes: %v", err)
			http.Error(w, "Ошибка получения маршрута: "+err.Error(), http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"driver": driver,
			"routes": routes,
		}

		log.Printf("GetRoutesHandler: found %d routes for driver %d", len(routes), driverID)

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("GetRoutesHandler: encoding error: %v", err)
			http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
		}
	} else if pointIDStr != "" {
		pointID, err := strconv.Atoi(pointIDStr)
		if err != nil {
			http.Error(w, "point_id должен быть числом", http.StatusBadRequest)
			return
		}

		routes, err := models.GetRoutesByPointID(r.Context(), pointID)
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
    // Разрешаем POST
    if r.Method != "POST" {
        http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
        return
    }

    routeIDStr := r.URL.Query().Get("route_id")
    status := r.URL.Query().Get("status")

    log.Printf("UpdateRouteStatusHandler: route_id=%s, status=%s", routeIDStr, status)

    if routeIDStr == "" || status == "" {
        http.Error(w, "route_id и status обязательны", http.StatusBadRequest)
        return
    }

    routeID, err := strconv.Atoi(routeIDStr)
    if err != nil {
        http.Error(w, "route_id должен быть числом", http.StatusBadRequest)
        return
    }

    // ВЫЗЫВАЕМ МОДЕЛЬ
    err = models.UpdateRouteStatus(r.Context(), routeID, status)
    if err != nil {
        log.Printf("UpdateRouteStatusHandler error: %v", err)
        http.Error(w, "Ошибка обновления статуса: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // Успех
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// AddRoutePointHandler - добавить точку в маршрут водителя
func AddRoutePointHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
        return
    }

    driverIDStr := r.URL.Query().Get("driver_id")
    pointIDStr := r.URL.Query().Get("point_id")

    log.Printf("AddRoutePointHandler: driver_id=%s, point_id=%s", driverIDStr, pointIDStr)

    if driverIDStr == "" || pointIDStr == "" {
        http.Error(w, "driver_id и point_id обязательны", http.StatusBadRequest)
        return
    }

    driverID, err := strconv.Atoi(driverIDStr)
    if err != nil {
        http.Error(w, "driver_id должен быть числом", http.StatusBadRequest)
        return
    }

    pointID, err := strconv.Atoi(pointIDStr)
    if err != nil {
        http.Error(w, "point_id должен быть числом", http.StatusBadRequest)
        return
    }

    // Вызываем модель для добавления точки
    err = models.AddRoutePoint(r.Context(), driverID, pointID)
    if err != nil {
        log.Printf("AddRoutePointHandler error: %v", err)
        http.Error(w, "Ошибка добавления точки: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// RemoveRoutePointHandler - удалить точку из маршрута водителя
func RemoveRoutePointHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != "DELETE" {
        http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
        return
    }

    driverIDStr := r.URL.Query().Get("driver_id")
    pointIDStr := r.URL.Query().Get("point_id")

    log.Printf("RemoveRoutePointHandler: driver_id=%s, point_id=%s", driverIDStr, pointIDStr)

    if driverIDStr == "" || pointIDStr == "" {
        http.Error(w, "driver_id и point_id обязательны", http.StatusBadRequest)
        return
    }

    driverID, err := strconv.Atoi(driverIDStr)
    if err != nil {
        http.Error(w, "driver_id должен быть числом", http.StatusBadRequest)
        return
    }

    pointID, err := strconv.Atoi(pointIDStr)
    if err != nil {
        http.Error(w, "point_id должен быть числом", http.StatusBadRequest)
        return
    }

    // Вызываем модель для удаления точки
    err = models.RemoveRoutePoint(r.Context(), driverID, pointID)
    if err != nil {
        log.Printf("RemoveRoutePointHandler error: %v", err)
        http.Error(w, "Ошибка удаления точки: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}