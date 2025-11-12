# EV Station Rental Auth Stack

This repository hosts the authentication service, MySQL database, and React UI that power the EV Station Rental system. The stack previously shipped with Kong Gateway and an HTTPS reverse proxy, but those services were removed so you can integrate your own gateway or ingress solution.

## Services

- **auth-backend** - Node.js API exposing authentication and station aggregation endpoints on port `8000` (published as `http://localhost:8003`).
- **frontend-build** - Builds the React SPA and serves the static bundle via Nginx on `http://localhost:8080`. The API base URL is injected at build time with `VITE_API_BASE_URL`.
- **mysql** - MySQL 8.0 database that stores auth data (published on `localhost:3306`) and persists to the `mysql_data` volume.

> **Manual gateway** - If you want traffic to flow through Kong, Traefik, or another gateway, provision it separately. The repository no longer includes the bundled Kong configuration or helper scripts; reuse assets from your infrastructure code or an earlier revision if needed.

## Quick Start

```powershell
cd EV-Station-based-Rental-System
docker compose up --build
```

- Frontend: http://localhost:8080
- Auth API: http://localhost:8003/api/v1
- MySQL: localhost:3306 (user: `root`, password from `MYSQL_ROOT_PASSWORD`)

Bring the stack down when finished:

```powershell
docker compose down
```

Add `-v` if you want to drop the persistent MySQL volume.

## Environment Configuration

`docker-compose.yml` reads values from your shell environment. Common overrides:

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | Root password for MySQL | `root` |
| `MYSQL_DATABASE` | Auth DB name | `authdb` |
| `JWT_SECRET` | HS256 secret used by the auth service | `your_production_jwt_secret` |
| `CLIENT_URL` | Comma-separated list of allowed origins for CORS | `http://localhost:3000,http://localhost:5173` |
| `VITE_API_BASE_URL` | API URL baked into the frontend bundle | `http://localhost:8003` |

Store overrides in an `.env` file next to `docker-compose.yml`, or export them before running Compose.

> **Backend env file** - The compose stack now also loads `AuthService/backend/.env` for the `mysql` and `auth-backend` services. Values in that file are applied first, then the overrides above ensure container-friendly defaults (for example `MYSQL_HOST=mysql`). Update the backend `.env` if you want Compose to pick up new secrets or database settings.

### Choosing the API Base URL

- **Direct backend access** - Leave `VITE_API_BASE_URL` at `http://localhost:8003` to call the auth service directly.
- **External gateway** - Point `VITE_API_BASE_URL` to your gateway (for example `http://localhost:8000`) and configure that gateway to proxy requests to the auth service and any station services you expose.

## Auth Service Details

### Directory Layout

- `backend/` - Express + MySQL auth API. Contains route handlers, data models, and environment defaults (`.env.docker`).
- `frontend/auth-ui/` - Vite-based React SPA. The Dockerfile builds the bundle and serves it with Nginx inside the container.
- `.env` - Sample front-end build overrides. The main Compose file reads environment variables from the repository root, not from here.

### Backend Quick Start

```powershell
cd AuthService/backend
cp .env.docker .env
# adjust values as needed (database, JWT secrets, station endpoints)
npm install
npm run dev
```

By default the backend listens on port `8000`. Update the `.env` file (or container environment) to point at your MySQL instance and station service endpoints.

#### Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DATABASE` / `MYSQL_USER` / `MYSQL_PASSWORD` | Database connection | `auth-db:3306`, `xdhdt`, `root`, `root` |
| `JWT_ACCESS_KEY` / `JWT_REFRESH_KEY` | Secrets for signing tokens | Pre-generated sample values - **replace in production** |
| `CLIENT_URL` | Comma-separated allowed origins | `http://localhost:5173` (or Compose override) |
| `STATION_PROXY_TARGETS` | Optional comma-separated upstream URLs | Unset (falls back to `STATION_FALLBACK_URL`) |
| `STATION_FALLBACK_URL` | Direct URL when no targets resolve | `http://localhost:3002/api/v1/stations` |

The backend forwards station requests to each `STATION_PROXY_TARGETS` entry in order until one responds successfully. When you operate without a gateway, point these variables directly at your station services (for example `http://192.168.1.101:3001/api/v1/stations`). When you reintroduce a gateway, set the targets to that gateway's endpoints instead.

### Frontend Quick Start

```powershell
cd AuthService/frontend/auth-ui
npm install
npm run dev
```

The SPA looks for its API base URL in this order: `?apiBaseUrl=` query string override, `localStorage`, environment variables (`VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_BACKEND_URL`, `VITE_APP_API`), then the current browser origin. During Docker builds, the Compose file injects `VITE_API_BASE_URL` (defaults to `http://localhost:8003` to match the published backend port).

### Production Build

```powershell
docker build -t auth-frontend ./AuthService/frontend/auth-ui
docker run --rm -p 8080:80 auth-frontend
```

Set `VITE_API_BASE_URL` at build time to point the bundled SPA at your chosen gateway or directly at the auth backend:

```powershell
docker build --build-arg VITE_API_BASE_URL=http://your-gateway.example.com -t auth-frontend ./AuthService/frontend/auth-ui
```

### Frontend Template Notes

- The React SPA started from the standard Vite + React template, so hot-module reloading and the default ESLint rules from that template are already in place.
- You can choose either `@vitejs/plugin-react` (Babel/oxc) or `@vitejs/plugin-react-swc` for Fast Refresh. Swap plugins in `vite.config.js` if you prefer the SWC variant.
- The new React Compiler is disabled by default to keep dev and build times predictable. Follow the [official guide](https://react.dev/learn/react-compiler/installation) if you want to enable it.
- For production-grade linting, consider migrating to the TypeScript-aware configuration documented in the [create-vite React + TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).

## Troubleshooting

### Common Issues

| Issue | Steps |
|-------|-------|
| Containers fail to build | Run `docker compose build --no-cache` and review the logs. Ensure Node.js packages install correctly. |
| Auth service unhealthy | Check logs with `docker compose logs auth-backend`. Verify MySQL is reachable and `JWT_SECRET` is set. |
| Frontend cannot reach API | Confirm `VITE_API_BASE_URL` matches the accessible URL (backend direct or gateway). Look for CORS errors in the browser console. |
| Reset MySQL data | `docker compose down -v` removes the persistent `mysql_data` volume. |

### Diagnostic Commands

- `docker compose ps` - Container state overview.
- `docker compose logs -f` - Tail all service logs.
- `docker compose logs auth-backend` - Inspect backend-specific output.
- `docker compose logs mysql` - Check database startup and permission errors.
- `docker compose logs frontend-build` - Confirm the bundle served successfully.
- `docker stats` - Live container resource usage.

### Legacy Kong Reference

Teams that still rely on Kong should restore the removed assets (`AuthService/kong`, `AuthService/scripts`, `AuthService/nginx`, `AuthService/stubs`, `mysql-init`) from an earlier commit or infrastructure repository. The deprecated troubleshooting playbooks included commands such as:

- `curl http://localhost:8001/status` - Kong status.
- `./scripts/kong-production-setup.sh` - Push declarative config.
- `./scripts/kong-jwt-setup.sh` - Re-sync JWT credentials.

Those scripts no longer ship with the project, so adjust the commands to match your restored setup.

## Next Steps

1. Stand up your preferred gateway (Kong, Traefik, API Gateway, etc.) and proxy traffic to the auth service and remote station services.
2. Update `VITE_API_BASE_URL` so the frontend targets the new gateway endpoint.
3. Re-run `docker compose up --build` to bake the new base URL into the frontend bundle.
4. If you continue using Kong, apply your own gateway configuration against the external instance by adapting the last revision of this repository that still contained `AuthService/kong`.

## License

MIT License - see `LICENSE` in the repository root.
