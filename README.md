# ResumeBuilder

Full-stack приложение: React/Vite клиент и Node.js/Express API с MongoDB.

## Локальный запуск

1. Установить зависимости сервера и клиента:

   ```bash
   npm --prefix server ci
   npm --prefix client ci
   ```

2. Создать `server/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/ResumeBuilder
   ```

3. Запустить сервер и клиент:

   ```bash
   npm --prefix server run dev
   npm --prefix client run dev
   ```
