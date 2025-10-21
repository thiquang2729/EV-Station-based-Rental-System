# Auth Service & Kong Gateway Integration

This directory contains the Node.js authentication service and supporting assets for integrating it behind a Kong API Gateway together with the station-related services (`rental-svc`, `fleet-svc`, and `admin-svc`).

The goal of this setup is to expose every backend through Kong, secure downstream calls with JWT validation, and provide a docker-compose stack for local development that mirrors production topology.

## Contents

- `backend/`: Express + MySQL auth service.
- `kong/kong.yml`: Declarative Kong configuration (services, routes, plugins, consumers).
- `docker-compose.kong.yml`: Local stack with Kong, Postgres, Auth backend, frontend, MySQL, and mock station services.
- `frontend/auth-ui/`: Vite SPA with Docker assets for static hosting behind Nginx.
- `scripts/kong-production-setup.sh`: Pushes the declarative config to a running Kong instance.
- `scripts/kong-jwt-setup.sh`: (Optional) Re-syncs the auth-service JWT credential if you rotate secrets.
- `stubs/mock-service/`: Lightweight Node stub used as placeholder services in the compose stack.

## Prerequisites

- Docker & Docker Compose v2
- Node.js 18+ (only if you want to run the backend outside Docker)
- MySQL 8 (when running outside Docker)

## Environment Variables

The backend reads configuration from `backend/.env` (local) or `backend/.env.docker` (compose). Key values to keep in sync:

| Variable | Description |
| --- | --- |
| `JWT_ACCESS_KEY` | HS256 secret used to sign access tokens. |
| `JWT_REFRESH_KEY` | Secret for refresh tokens. |
| `JWT_ISSUER` | Defaults to `auth-service`. Must match the Kong JWT `key`. |
| `STATION_PROXY_TARGETS` | Comma-separated list of upstream station endpoints. In Docker it defaults to `http://kong:8000/api/v1/stations`. |
| `KONG_JWT_SECRET` | Environment variable passed to the Kong container and must equal `JWT_ACCESS_KEY`. |
| `VITE_API_BASE_URL` | URL the frontend calls for API requests (default `http://kong:8000`). |

> Compose reads a `.env` file placed next to `docker-compose.kong.yml`. Minimum example:
>
> ```
> KONG_JWT_SECRET=change-me
> VITE_API_BASE_URL=http://kong:8000
> ```

When you change `JWT_ACCESS_KEY`, update `KONG_JWT_SECRET` (in compose or deployment environment) and re-run `scripts/kong-production-setup.sh` or `scripts/kong-jwt-setup.sh`.

## Running the local stack

```bash
docker compose -f docker-compose.kong.yml up --build
```

The compose stack starts:

1. MySQL (`auth-db`) for the auth service.
2. Postgres (`kong-database`) for Kong.
3. Kong migrations (`kong-migrations`) and Kong (`kong`).
4. The auth backend (`auth-backend`).
5. Mock services for `rental`, `fleet`, and `admin`.
6. The Vite frontend served by Nginx (`frontend`) on `http://localhost:5173`.
7. `kong-config`, which posts `kong/kong.yml` to the Admin API once Kong is healthy.

You can rerun the configuration push manually with:

```bash
./scripts/kong-production-setup.sh
```

All containers share the `gateway-net` network so Kong can reach the services via their names.

## Kong configuration overview

`kong/kong.yml` defines:

- Services for `auth-service`, `rental-svc`, `fleet-svc`, `admin-svc`, and a load-balanced `stations-service`.
- Upstream `stations-upstream` balancing between `rental-svc:3002` and `fleet-svc:3003`.
- JWT plugin on every downstream service (except auth) using the `iss` claim.
- CORS, rate-limiting, and file-log plugins applied globally.

### Health endpoints

To avoid path collisions, health checks are exposed as:

- `/health/rental`
- `/health/fleet`
- `/health/admin`

The auth service itself exposes `/health` directly (no proxy required).

## Backend changes

- `GET /health` performs a MySQL ping and returns service status.
- `GET /api/v1/stations` now proxies to configured upstreams (`STATION_PROXY_TARGETS`), forwarding key headers and falling back to sample data only when enabled.
- JWT access and refresh tokens include the `iss` claim so Kong's JWT plugin can validate them.
- The frontend resolves its API base URL in this order: `?apiBaseUrl=` query param (persisted to `localStorage`), stored `localStorage` override, environment variables (`VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_BACKEND_URL`, `VITE_APP_API`), then browser origin. Use `http://localhost:5173/?apiBaseUrl=http://localhost:8000` to switch targets at runtime; call `clearApiBaseUrlOverride()` in DevTools to reset.

## Testing

Assuming the compose stack is running:

1. Register/login to obtain an access token:
   ```bash
   curl -i http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@example.com","password":"Secret123!"}'
   ```

2. Call a protected endpoint via Kong (replace `ACCESS_TOKEN` with the JWT from step 1):
   ```bash
   curl -i http://localhost:8000/api/v1/bookings \
     -H "Authorization: Bearer ACCESS_TOKEN"
   ```

3. Verify the stations route balances across services:
   ```bash
   curl -s http://localhost:8000/api/v1/stations \
     -H "Authorization: Bearer ACCESS_TOKEN" | jq .
   ```

4. Hit the frontend (served from Nginx):
   - Open `http://localhost:5173/` in the browser and confirm network requests go to `http://localhost:8000/...`.
   - Alternatively:
     ```bash
     curl http://localhost:5173/
     ```

5. Health checks:
   ```bash
   curl http://localhost:8000/health            # Auth service
   curl http://localhost:8000/health/rental     # Through Kong -> rental-svc
   ```

Requests without a valid JWT should receive `401/403` responses from Kong.

## Rotating JWT secrets

If you rotate `JWT_ACCESS_KEY` / `KONG_JWT_SECRET`:

1. Update environment values (compose file, secrets manager, etc.).
2. Restart the stack.
3. (Optional) Run `./scripts/kong-jwt-setup.sh` to force the credential to be recreated via the Admin API.

## Deploying to other environments

- Provide real images for `rental-svc`, `fleet-svc`, and `admin-svc` (replace the stub services in compose or deployment manifests).
- Ensure Kong can reach each service (consider VPC peering, VPN, or private load balancers).
- Harden secrets: mount them via secrets manager instead of `.env` when in production.
- Enable TLS on the Kong proxy listeners for internet-facing deployments.

## Useful commands

- Tail Kong logs: `docker compose -f docker-compose.kong.yml logs -f kong`
- Reapply DTO config: `./scripts/kong-production-setup.sh` (script uses `Content-Type: application/yaml`; when calling Admin API manually ensure you add `-H "Content-Type: application/yaml"` to avoid HTTP 415)
- Clean stack: `docker compose -f docker-compose.kong.yml down -v`

## Troubleshooting

- `502` from `/api/v1/stations`: check `STATION_PROXY_TARGETS` and that downstream services are healthy.
- `401/403` from Kong: confirm `Authorization: Bearer` header is present and that `iss` claim equals `auth-service`.
- Migrations failing: ensure the Postgres password matches `KONG_DB_PASSWORD`.
- Frontend returning `502` / blank page: ensure `frontend` service built successfully and `VITE_API_BASE_URL` points to the reachable Kong proxy.
