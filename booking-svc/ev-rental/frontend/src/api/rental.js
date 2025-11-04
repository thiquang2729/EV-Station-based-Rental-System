import { RENTAL_BASE, RENTAL_DIRECT } from '../lib/constants';
import { api } from '../lib/apiClient';

// Use direct service URL for Docker environment
const RENTAL_API = RENTAL_DIRECT;

export const listStations = () => api(`${RENTAL_API}/stations`);
export const getStation   = (id) => api(`${RENTAL_API}/stations/${id}`);
export const createStation = (data) => api(`${RENTAL_API}/stations`, { method: 'POST', body: data });
export const updateStation = (id, data) => api(`${RENTAL_API}/stations/${id}`, { method: 'PUT', body: data });
export const deleteStation = (id) => api(`${RENTAL_API}/stations/${id}`, { method: 'DELETE' });

export const listVehicles = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`${RENTAL_API}/vehicles${qs ? `?${qs}` : ''}`);
};
export const getVehicle   = (id) => api(`${RENTAL_API}/vehicles/${id}`);

export const listBookings  = () => api(`${RENTAL_API}/bookings`);
export const createBooking = (payload) => api(`${RENTAL_API}/bookings`, { method: 'POST', body: payload });
export const returnBooking = (id) => api(`${RENTAL_API}/bookings/${id}/return`, { method: 'PATCH' });
