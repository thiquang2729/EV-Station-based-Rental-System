export const API_GATEWAY = import.meta.env.VITE_API_GATEWAY || 'http://localhost:4000';
export const RENTAL_BASE = `${API_GATEWAY}/rental/api/v1`;
export const FLEET_BASE  = `${API_GATEWAY}/fleet/api/v1`;
export const ADMIN_BASE  = `${API_GATEWAY}/admin`;

