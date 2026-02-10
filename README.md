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