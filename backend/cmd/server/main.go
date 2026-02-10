package main

import (
	"log"
	"net/http"
	"garbage_trucks/backend/internal/config"
	"garbage_trucks/backend/internal/database"
	"garbage_trucks/backend/internal/router"
)

func main() {
	// Загружаем .env
	cfg := config.Load()

	// Подключаемся к базе данных
	database.Init(cfg)

	// Создаём роутер
	r := router.NewRouter()

	// Запускаем сервер
	log.Printf("Сервер запущен на http://localhost%s", cfg.Port)
	log.Fatal(http.ListenAndServe(cfg.Port, r))
}