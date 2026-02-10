package database

import (
	"context"
	"fmt"
	"log"
	"strings"
	"garbage_trucks/backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Init(cfg *config.Config) {
	var connStr string
	
	// Приоритет: DATABASE_URL > отдельные параметры
	if cfg.DatabaseURL != "" {
		connStr = cfg.DatabaseURL
		// Добавляем sslmode=require если его нет (нужно для Neon.tech)
		if !strings.Contains(connStr, "sslmode=") {
			if strings.Contains(connStr, "?") {
				connStr += "&sslmode=require"
			} else {
				connStr += "?sslmode=require"
			}
		}
	} else {
		// Используем отдельные параметры (для разработки)
		connStr = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName,
		)
	}

	log.Printf("Подключаемся к БД: %s", strings.Replace(connStr, cfg.DBPassword, "***", 1))

	var err error
	Pool, err = pgxpool.New(context.Background(), connStr)
	if err != nil {
		log.Fatal("Ошибка подключения к базе данных:", err)
	}

	// Проверяем подключение
	if err = Pool.Ping(context.Background()); err != nil {
		log.Fatal("Пинг базы не прошёл:", err)
	}

	log.Println("✅ Подключение к PostgreSQL установлено успешно!")
}