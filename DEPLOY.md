# Деплой на Railway + Vercel

## 1. Бэкенд на Railway

### Шаг 1: Загрузите код на GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Шаг 2: На Railway.app
1. Нажмите "+ New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически обнаружит Dockerfile

### Шаг 3: Добавьте PostgreSQL
1. В проекте нажмите "+ New"
2. Выберите "Database" → "Add PostgreSQL"
3. Railway автоматически создаст переменные: DATABASE_URL

### Шаг 4: Настройте переменные окружения
В настройках Go сервиса добавьте:
```
PORT=8080
FRONTEND_URL=https://ваш-домен.vercel.app
```

### Шаг 5: Получите URL бэкенда
После деплоя скопируйте URL (например: https://your-app.railway.app)

## 2. Фронтенд на Vercel

### Шаг 1: Установите Vercel CLI
```bash
npm install -g vercel
```

### Шаг 2: Деплой
```bash
cd frontend
vercel login
vercel
```

### Шаг 3: Добавьте переменную окружения
В настройках проекта на vercel.com:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Шаг 4: Редеплой
```bash
vercel --prod
```

## 3. Обновите CORS в бэкенде

После получения URL Vercel, обновите `backend/internal/middleware/cors.go`:
```go
w.Header().Set("Access-Control-Allow-Origin", "https://your-app.vercel.app")
```

Готово! 🎉
