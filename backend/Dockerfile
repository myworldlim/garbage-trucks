# Используем более новый образ Go
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Устанавливаем зависимости для сборки
RUN apk add --no-cache gcc musl-dev

# Копируем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем весь код
COPY . .

# Собираем бинарник
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main ./cmd/server

# Финальный образ
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Копируем бинарник
COPY --from=builder /app/main .

# Копируем .env файл (опционально, для fallback)
COPY .env ./

# Открываем порт (ВАЖНО: Fly.io использует 8080 по умолчанию)
EXPOSE 8080

# Запускаем приложение
CMD ["./main"]