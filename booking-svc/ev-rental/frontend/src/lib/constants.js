export const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || 'http://localhost:4000';

// Localhost URLs for services (like auth and billing)
export const RENTAL_BASE = `${API_GATEWAY}/rental/api/v1`;
export const FLEET_BASE = `${API_GATEWAY}/fleet/api/v1`;
export const ADMIN_BASE = `${API_GATEWAY}/admin`;

// Direct localhost service URLs
export const RENTAL_DIRECT = 'http://localhost:3002/api/v1';
export const FLEET_DIRECT = 'http://localhost:3003/api/v1';
export const ADMIN_DIRECT = 'http://localhost:3001';

