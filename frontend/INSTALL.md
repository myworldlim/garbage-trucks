# Установка фронтенда

## Шаг 1: Создайте структуру директорий
Запустите setup.bat или создайте вручную:
```
frontend/
├── app/
│   ├── driver/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── public/
│   └── manifest.json
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local
```

## Шаг 2: Установите зависимости
```bash
npm install
```
yarn install

## Шаг 3: Запустите приложение
```bash
npm run dev
```

Приложение будет доступно на http://localhost:6000
