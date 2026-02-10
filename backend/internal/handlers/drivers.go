package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"garbage_trucks/backend/internal/models"
	"github.com/gorilla/mux"
)

func GetDriversHandler(w http.ResponseWriter, r *http.Request) {
	drivers, err := models.GetAllDrivers(context.Background())
	if err != nil {
		http.Error(w, "Ошибка получения водителей", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(drivers); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func CreateDriverHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Имя обязательно", http.StatusBadRequest)
		return
	}

	driver, err := models.CreateDriver(context.Background(), req.Name)
	if err != nil {
		http.Error(w, "Ошибка создания водителя", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(driver); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func DeleteDriverHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id должен быть числом", http.StatusBadRequest)
		return
	}

	err = models.DeleteDriver(context.Background(), id)
	if err != nil {
		http.Error(w, "Ошибка удаления водителя", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"status": "success"}); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}

func UpdateDriverHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "id должен быть числом", http.StatusBadRequest)
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Неверный формат данных", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Имя обязательно", http.StatusBadRequest)
		return
	}

	driver, err := models.UpdateDriver(context.Background(), id, req.Name)
	if err != nil {
		http.Error(w, "Ошибка обновления водителя", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(driver); err != nil {
		http.Error(w, "Ошибка кодирования ответа", http.StatusInternalServerError)
	}
}