# resumebuilder

full-stack приложение: react/vite клиент и node.js/express api с mongodb.

## локальный запуск

1) установить зависимости сервера и клиента:

   ```bash
   npm --prefix server ci
   npm --prefix client ci
   ```

2) создать `server/.env`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/ResumeBuilder
   ```

3) запустить сервер и клиент:

   ```bash
   npm --prefix server run dev
   npm --prefix client run dev
   ```
