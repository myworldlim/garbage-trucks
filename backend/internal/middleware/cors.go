package middleware

import (
	"net/http"
	"os"
	"strings"
)

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Динамическое определение origin (важно для продакшена!)
		allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
		if allowedOrigins == "" {
			// Для разработки по умолчанию
			allowedOrigins = "http://localhost:3000,http://localhost:3001"
		}
		
		origin := r.Header.Get("Origin")
		
		// Проверяем, разрешен ли origin
		allowed := false
		for _, o := range strings.Split(allowedOrigins, ",") {
			if strings.TrimSpace(o) == origin || o == "*" {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				allowed = true
				break
			}
		}
		
		// Если origin не найден в разрешенных, не устанавливаем заголовок
		if !allowed && origin != "" {
			// Можно логировать, но не прерывать запрос
		}
		
		// 2. Добавляем больше заголовков для фронтенда
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "3600")

		// 3. Обрабатываем preflight
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}