**EV Rental Frontend (React + Vite)**

Build the UI on top of the existing backend services and Nginx gateway.

**What You Have**
- React 19 + Vite 7 + React Router in `frontend/`.
- Backend services exposed via Nginx gateway on `http://localhost:4000`.
- Service prefixes mapped by Nginx:
  - Rental: `/rental/api/v1` (stations, vehicles, bookings)
  - Fleet: `/fleet/api/v1` (vehicles, incidents, overview)
  - Admin: `/admin` (vehicles, reports, health)

**Prereqs**
- Node.js 18 or 20 LTS
- npm (or pnpm/yarn if you prefer)
- Backend up via Docker: run `docker-compose up -d` at repo root

**Environment Setup**
- Create `frontend/.env` with:
  - `VITE_API_GATEWAY=http://localhost:4000`
- Optional: if you prefer dev proxy instead of env, see the Vite proxy snippet below.

**Run Frontend**
- Install deps: `cd frontend && npm i`
- Start dev: `npm run dev` (default `http://localhost:5173`)
- Verify backend gateway: open `http://localhost:4000/rental/api/v1/vehicles`

**Recommended Folders**
- `src/api/` REST calls grouped by service: `rental.js`, `fleet.js`, `admin.js`
- `src/lib/` utilities: `apiClient.js`, `constants.js`, helpers
- `src/pages/` route pages: `Home`, `Listing`, `CarDetails`, `MyBookings`, `Contact`, `Admin/*`
- `src/components/` UI building blocks

**Constants**
Create `src/lib/constants.js`:
```
export const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || 'http://localhost:4000';
export const RENTAL_BASE = `${API_GATEWAY}/rental/api/v1`;
export const FLEET_BASE  = `${API_GATEWAY}/fleet/api/v1`;
export const ADMIN_BASE  = `${API_GATEWAY}/admin`;
```

**HTTP Client**
Create `src/lib/apiClient.js`:
```
export async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}
```

**Service APIs**
Create `src/api/rental.js`:
```
import { RENTAL_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listStations   = () => api(`${RENTAL_BASE}/stations`);
export const listVehicles   = () => api(`${RENTAL_BASE}/vehicles`);
export const getVehicle     = (id) => api(`${RENTAL_BASE}/vehicles/${id}`);
export const listBookings   = () => api(`${RENTAL_BASE}/bookings`);
export const createBooking  = (payload) => api(`${RENTAL_BASE}/bookings`, { method: 'POST', body: payload });
export const returnBooking  = (id) => api(`${RENTAL_BASE}/bookings/${id}/return`, { method: 'PATCH' });
```

Create `src/api/fleet.js` (optional admin features):
```
import { FLEET_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listFleetVehicles = () => api(`${FLEET_BASE}/vehicles`);
export const updateVehicleStatus = (id, data) => api(`${FLEET_BASE}/vehicles/${id}/status`, { method: 'PUT', body: data });
```

Create `src/api/admin.js` (optional):
```
import { ADMIN_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listAdminVehicles = () => api(`${ADMIN_BASE}/vehicles`);
export const listReports       = () => api(`${ADMIN_BASE}/reports`);
export const resolveReport     = (id) => api(`${ADMIN_BASE}/reports/${id}`, { method: 'PUT' });
```

**Wire Pages To Data**
- `Listing` page: fetch and render vehicles from `listVehicles()`.
- `CarDetails` page: `getVehicle(id)` and a “Đặt xe” form with fields `startTime`, `estDurationH` → call `createBooking({ vehicleId, startTime, estDurationH })`.
- `MyBookings` page: `listBookings()`; each row has “Trả xe” → `returnBooking(id)`.
- `Home` page: shortcut links to Stations/Listing; optionally show top available vehicles.

Example usage in a page:
```
// src/pages/Listing.jsx
import { useEffect, useState } from 'react';
import { listVehicles } from '../api/rental';

export default function Listing() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listVehicles()
      .then((res) => setData(res.data || res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  return (
    <div className="grid gap-4">
      {data.map((v) => (
        <div key={v.id} className="p-4 border rounded">
          <div className="font-semibold">{v.name || v.id}</div>
          <div>Trạng thái: {v.isAvailable ? 'Sẵn sàng' : 'Đang bận'}</div>
          <div>Giá/giờ: {v.pricePerHour ?? '-'} đ</div>
        </div>
      ))}
    </div>
  );
}
```

**Routing**
- Already configured in `src/App.jsx` with `react-router-dom` routes:
  - `/` → `Home`
  - `/listing` → `Listing`
  - `/listing/:id` → `CarDetails`
  - `/my-bookings` → `MyBookings`
  - `/contact` → `Contact`

**Dev Proxy (optional)**
If you’d rather not set `VITE_API_GATEWAY`, proxy these paths in `vite.config.js`:
```
server: {
  proxy: {
    '/rental': 'http://localhost:4000',
    '/fleet': 'http://localhost:4000',
    '/admin': 'http://localhost:4000'
  }
}
```
Then call APIs with relative URLs like `/rental/api/v1/vehicles`.

**Backend Reference**
- Gateway port: `4000` (`nginx-gateway` in `docker-compose.yml`)
- Rental endpoints in service code:
  - `GET /rental/api/v1/stations`
  - `GET /rental/api/v1/vehicles`
  - `GET /rental/api/v1/vehicles/:id`
  - `GET /rental/api/v1/bookings`
  - `POST /rental/api/v1/bookings` (body: `{ vehicleId, startTime, estDurationH, userId? }`)
  - `PATCH /rental/api/v1/bookings/:id/return`

**Suggested Implementation Order**
1) Env + API client + constants
2) Listing page (hiển thị xe, link chi tiết)
3) CarDetails (hiển thị info, form đặt xe)
4) MyBookings (liệt kê + Trả xe)
5) Trang Stations (nếu cần luồng chọn trạm trước)
6) Admin (tối thiểu: danh sách xe và reports)

**Troubleshooting**
- 400/500 errors: check `docker-compose logs -f nginx-gateway rental-svc fleet-svc`
- CORS: gateway already fronts services; prefer calling via `http://localhost:4000`
- Data empty: ensure MySQL container is healthy and services have migrated/seeded data (if applicable)

That’s it. Start with Listing → Booking flow, then iterate UI/UX.

**Service API Modules (Copy/Paste)**
Below are ready-to-use modules for each service. You can either paste them into files, or keep as reference.

1) `src/lib/constants.js`
```
export const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || 'http://localhost:4000';
export const RENTAL_BASE = `${API_GATEWAY}/rental/api/v1`;
export const FLEET_BASE  = `${API_GATEWAY}/fleet/api/v1`;
export const ADMIN_BASE  = `${API_GATEWAY}/admin`;
```

2) `src/lib/apiClient.js`
```
export async function api(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(path, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}
```

3) `src/api/rental.js`
```
import { RENTAL_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

// Stations
export const listStations = () => api(`${RENTAL_BASE}/stations`);
export const getStation   = (id) => api(`${RENTAL_BASE}/stations/${id}`);

// Vehicles (for renters)
export const listVehicles = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`${RENTAL_BASE}/vehicles${qs ? `?${qs}` : ''}`);
};
export const getVehicle   = (id) => api(`${RENTAL_BASE}/vehicles/${id}`);

// Bookings
export const listBookings  = () => api(`${RENTAL_BASE}/bookings`);
export const createBooking = (payload) => api(`${RENTAL_BASE}/bookings`, { method: 'POST', body: payload });
export const returnBooking = (id) => api(`${RENTAL_BASE}/bookings/${id}/return`, { method: 'PATCH' });
```

4) `src/api/fleet.js` (staff/admin)
```
import { FLEET_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

// Vehicles in fleet service
export const listFleetVehicles   = () => api(`${FLEET_BASE}/vehicles`);
export const getFleetVehicle     = (id) => api(`${FLEET_BASE}/vehicles/${id}`);
export const updateVehicleStatus = (id, data) => api(`${FLEET_BASE}/vehicles/${id}/status`, { method: 'PUT', body: data });

// Incidents
export const listIncidents  = () => api(`${FLEET_BASE}/incidents`);
export const createIncident = (payload) => api(`${FLEET_BASE}/incidents`, { method: 'POST', body: payload });

// Overview dashboard
export const getOverview = () => api(`${FLEET_BASE}/overview`);
```

5) `src/api/admin.js`
```
import { ADMIN_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listAdminVehicles = () => api(`${ADMIN_BASE}/vehicles`);
export const listReports       = () => api(`${ADMIN_BASE}/reports`);
export const resolveReport     = (id) => api(`${ADMIN_BASE}/reports/${id}`, { method: 'PUT' });
```

**Usage Examples**
- Listing vehicles (rental):
```
import { useEffect, useState } from 'react';
import { listVehicles } from '../api/rental';

export default function Listing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listVehicles({ available: true })
      .then((res) => setItems(res.data || res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return 'Loading…';
  if (error) return <div className="text-red-600">{error}</div>;
  return (
    <ul>
      {items.map(v => <li key={v.id}>{v.name || v.id}</li>)}
    </ul>
  );
}
```

- Create a booking:
```
import { createBooking } from '../api/rental';

async function onBook(vehicleId, startTime, estDurationH) {
  await createBooking({ vehicleId, startTime, estDurationH });
}
```

- Return a booking:
```
import { returnBooking } from '../api/rental';

async function onReturn(id) {
  await returnBooking(id);
}
```

- Update vehicle status (fleet):
```
import { updateVehicleStatus } from '../api/fleet';

await updateVehicleStatus('veh-1', { isAvailable: false, status: 'MAINTENANCE' });
```
