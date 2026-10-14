# Módulo de autenticación

Aplicación TypeScript con React/Vite, Express, Prisma y PostgreSQL. La sesión se guarda en una cookie JWT `HttpOnly` de 15 minutos; el navegador nunca recibe el JWT. Las operaciones que cambian estado verifican un token CSRF de doble envío y el origen exacto del frontend.

## Estructura

- `backend/prisma`: modelo de usuario y migración inicial.
- `backend/src/auth`: endpoints, validación y lógica de autenticación.
- `backend/src/middleware`: validación de solicitudes, CSRF y errores.
- `frontend/src/api`: llamadas a la API con cookies y CSRF.
- `frontend/src/App.tsx`: formularios, rutas y página protegida.

## Ejecutar en desarrollo

1. Usa Node.js 20 o superior y una instancia local de PostgreSQL en ejecución. Crea la base de datos `auth_app` (por ejemplo, desde pgAdmin o con `createdb -U TU_USUARIO auth_app`). El usuario y la contraseña de PostgreSQL deben coincidir con los de `DATABASE_URL`.
2. Desde la raíz del proyecto, en PowerShell, crea el archivo de entorno del backend si aún no existe y edítalo:

   ```powershell
   if (!(Test-Path backend\.env)) { Copy-Item .env.example backend\.env }
   notepad backend\.env
   ```

   Configura `DATABASE_URL` con la conexión local real (incluida la base de datos `auth_app`) y reemplaza `JWT_SECRET` por un secreto aleatorio. Puedes generarlo con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y pegar el resultado en `backend\.env`. No uses los valores de ejemplo como credenciales de producción.
3. Desde la raíz instala dependencias, genera el cliente Prisma y aplica la migración de desarrollo:

   ```sh
   npm install
   npm run db:generate
   npm run db:migrate
   npm run dev
   ```

   Prisma aplica la migración a la base de datos ya creada; estos comandos no crean la base de datos PostgreSQL ni el usuario.
4. Abre `http://localhost:5173`. La API escucha en `http://localhost:4000`. El backend carga `backend/.env` al iniciarse mediante los scripts de npm del workspace.

## Endpoints

- `GET /api/auth/csrf`: prepara la cookie CSRF y devuelve el token para la cabecera `X-CSRF-Token`.
- `POST /api/auth/register`: recibe `{ "email": "...", "password": "..." }` y crea una cuenta.
- `POST /api/auth/login`: recibe el mismo formato e inicia sesión.
- `GET /api/auth/me`: devuelve el usuario de la sesión actual.
- `POST /api/auth/logout`: elimina la cookie de sesión.

El límite predeterminado es de 10 intentos por IP cada 15 minutos para registro e inicio de sesión. El limitador usa almacenamiento en memoria: en despliegues con varias instancias, configúralo con un almacén compartido para que el límite aplique de forma global. En producción sirve el frontend y la API bajo HTTPS y establece `NODE_ENV=production`, `CLIENT_ORIGIN` al origen real del frontend y un `JWT_SECRET` aleatorio de al menos 32 caracteres. Si la API está detrás de un proxy, configura Express para confiar únicamente en las direcciones de ese proxy antes de desplegar.

En producción aplica las migraciones con `npm run db:deploy`; `npm run db:migrate` está destinado al desarrollo local.
