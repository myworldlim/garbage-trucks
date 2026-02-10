package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBUser      string
	DBPassword  string
	DBHost      string
	DBPort      string
	DBName      string
	Port        string
	FrontendURL string
	DatabaseURL string // Для Fly.io + Neon.tech
}

func Load() *Config {
	// Загружаем .env (только для разработки)
	if _, err := os.Stat(".env"); err == nil {
		godotenv.Load()
	}

	// В продакшене Fly.io передаёт DATABASE_URL как единую строку
	databaseURL := os.Getenv("DATABASE_URL")
	var dbUser, dbPassword, dbHost, dbPort, dbName string

	if databaseURL != "" {
		// Парсим DATABASE_URL если он есть
		// Формат: postgres://user:password@host:port/dbname
		parts := strings.Split(strings.TrimPrefix(databaseURL, "postgres://"), "@")
		if len(parts) == 2 {
			credsHost := strings.Split(parts[0], ":")
			if len(credsHost) >= 2 {
				dbUser = credsHost[0]
				dbPassword = credsHost[1]
			}

			hostDB := strings.Split(parts[1], "/")
			if len(hostDB) == 2 {
				hostPort := strings.Split(hostDB[0], ":")
				if len(hostPort) == 2 {
					dbHost = hostPort[0]
					dbPort = hostPort[1]
				} else {
					dbHost = hostPort[0]
					dbPort = "5432"
				}
				dbName = hostDB[1]
				// Убираем параметры запроса если есть
				if idx := strings.Index(dbName, "?"); idx != -1 {
					dbName = dbName[:idx]
				}
			}
		}
	}

	return &Config{
		DBUser:      getEnvWithFallback("DB_USER", dbUser, "postgres"),
		DBPassword:  getEnvWithFallback("DB_PASSWORD", dbPassword, "toor"),
		DBHost:      getEnvWithFallback("DB_HOST", dbHost, "127.0.0.1"),
		DBPort:      getEnvWithFallback("DB_PORT", dbPort, "5432"),
		DBName:      getEnvWithFallback("DB_NAME", dbName, "garbage_trucks"),
		Port:        ":" + getEnv("PORT", "8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		DatabaseURL: databaseURL, // Сохраняем оригинальный URL
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvWithFallback(key, primaryFallback, secondaryFallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	if primaryFallback != "" {
		return primaryFallback
	}
	return secondaryFallback
}
