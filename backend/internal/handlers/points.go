package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"garbage_trucks/backend/internal/models"
	"github.com/gorilla/mux"
)

func GetPointsHandler(w http.ResponseWriter, r *http.Request) {
	points, err := models.GetAllPoints(context.Background())
	if err != nil {
		http.Error(w, "Ошибка получения точек", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(points); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func CreatePointHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name      string  `json:"name"`
		Address   string  `json:"address"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		City      string  `json:"city"`
		DriverIDs []int   `json:"driver_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	log.Printf("Creating point: %s, drivers: %v, len: %d", req.Name, req.DriverIDs, len(req.DriverIDs))

	if req.Name == "" || req.Address == "" {
		http.Error(w, "Название и адрес обязательны", http.StatusBadRequest)
		return
	}

	point, err := models.CreatePointWithDrivers(context.Background(), req.Name, req.Address, req.City, req.Latitude, req.Longitude, req.DriverIDs)
	if err != nil {
		log.Printf("Error creating point: %v", err)
		http.Error(w, "Ошибка создания точки", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(point); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func DeletePointHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id должен быть числом", http.StatusBadRequest)
		return
	}

	err = models.DeletePoint(context.Background(), id)
	if err != nil {
		http.Error(w, "Ошибка удаления точки", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "success"}); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func UpdatePointHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "PUT" {
		http.Error(w, "Метод не разрешён", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id должен быть числом", http.StatusBadRequest)
		return
	}

	var req struct {
		Name      string  `json:"name"`
		Address   string  `json:"address"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		City      string  `json:"city"`
		DriverIDs []int   `json:"driver_ids"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	log.Printf("Updating point %d: %s, drivers: %v", id, req.Name, req.DriverIDs)

	if req.Name == "" || req.Address == "" {
		http.Error(w, "Название и адрес обязательны", http.StatusBadRequest)
		return
	}

	point, err := models.UpdatePointWithDrivers(context.Background(), id, req.Name, req.Address, req.City, req.Latitude, req.Longitude, req.DriverIDs)
	if err != nil {
		log.Printf("Error updating point: %v", err)
		http.Error(w, "Ошибка обновления точки", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(point); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}
