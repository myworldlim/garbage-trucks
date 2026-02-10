# Перейдите в папку проекта
cd C:\Users\Dmitry\Desktop\garbage_ruck

# Инициализируйте git (если еще не)
git init

# Добавьте все файлы
git add .

# Коммит
git commit -m "Initial commit: Go backend + Next.js frontend"

# Добавьте удаленный репозиторий
git remote add origin https://github.com/myworldlim/garbage-trucks.git

# Запушьте
git branch -M main
git push -u origin main


# 1. Настройте ваше имя и email
git config --global user.name "myworldlim"
git config --global user.email "my.world.lim@gmail.com"

# 2. Проверьте настройки
git config --global --list

# 3. Создайте коммит
git commit -m "Initial commit: Go backend + Next.js frontend"

# 4. Добавьте удаленный репозиторий
git remote add origin https://github.com/myworldlim/garbage-trucks.git

# 5. Переименуйте ветку
git branch -M main

# 6. Запушьте код
git push -u origin main



# Создать новую ветку для фичи/багфикса
git checkout -b feature/карта-и-геолокация

# Или новый стандарт
git switch -c feature/карта-и-геолокация

# Перейти на существующую ветку
git checkout main
git switch main

# Посмотреть все ветки (локальные)
git branch

# Посмотреть все ветки (включая удаленные)
git branch -a

# Удалить локальную ветку
git branch -d feature/название

# Удалить удаленную ветку
git push origin --delete feature/название

2. Рекомендуемый workflow
Шаг 1: Создать ветку для новой фичи
cd C:\Users\Dmitry\Desktop\garbage_ruck
git switch -c feature/карта-и-геолокация

Шаг 2: Делать изменения
# Редактируйте файлы...
# Тестируйте локально (npm run dev, go run cmd/server/main.go)

Шаг 3: Зафиксировать изменения
# Показать изменения
git diff

# Добавить все файлы
git add .

# Или добавить конкретный файл
git add frontend/app/driver/[id]/page.tsx

# Сделать коммит с описанием
git commit -m "feat: добавить отслеживание геолокации и слой пробок"

Шаг 4: Загрузить ветку на сервер
git push origin feature/карта-и-геолокация

Шаг 5: Создать Pull Request (PR) в GitHub
Откройте https://github.com/ваш-аккаунт/garbage_ruck
Нажмите "New Pull Request"
Выберите feature/карта-и-геолокация → main
Напишите описание изменений
Нажмите "Create Pull Request"

Шаг 6: Слить в main (после review)
git switch main
git pull origin main
git merge feature/карта-и-геолокация
git push origin main




. Практический пример для вашего проекта
Если хотите добавить фичу с картой, не ломая основное приложение:
# 1. Создать ветку
git switch -c feature/карта-улучшения

# 2. Редактировать (я помогу)
# frontend/app/driver/[id]/page.tsx
# frontend/app/layout.tsx
# etc.

# 3. Тестировать локально
cd frontend
npm run dev
# Открыть http://localhost:3000 и протестировать

# 4. Если всё работает - коммитить
git add frontend/app/driver/[id]/page.tsx frontend/app/layout.tsx
git commit -m "feat: добавить геолокацию в реальном времени и слой пробок"

# 5. Если нужно вернуться на main (откатить экспериментальные изменения)
git switch main
git pull origin main
# Ветка feature/карта-улучшения остаётся нетронутой

# 6. Когда фича готова - слить обратно
git merge feature/карта-улучшения
git push origin main

4. Откат изменений (если что-то сломалось)
# Откатить локальные файлы (самый частый случай)
git restore .

# Откатить определённый файл
git restore frontend/app/driver/[id]/page.tsx

# Откатить последний коммит (если уже закоммичено)
git reset --soft HEAD~1

# Откатить и удалить последний коммит полностью
git reset --hard HEAD~1

# Вернуться к определённому коммиту
git reset --hard e6697ad

