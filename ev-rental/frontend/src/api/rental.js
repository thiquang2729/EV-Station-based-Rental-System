import { RENTAL_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listStations = () => api(`${RENTAL_BASE}/stations`);
export const getStation   = (id) => api(`${RENTAL_BASE}/stations/${id}`);
export const createStation = (data) => api(`${RENTAL_BASE}/stations`, { method: 'POST', body: data });
export const updateStation = (id, data) => api(`${RENTAL_BASE}/stations/${id}`, { method: 'PUT', body: data });
export const deleteStation = (id) => api(`${RENTAL_BASE}/stations/${id}`, { method: 'DELETE' });

export const listVehicles = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`${RENTAL_BASE}/vehicles${qs ? `?${qs}` : ''}`);
};
export const getVehicle   = (id) => api(`${RENTAL_BASE}/vehicles/${id}`);

export const listBookings  = () => api(`${RENTAL_BASE}/bookings`);
export const createBooking = (payload) => api(`${RENTAL_BASE}/bookings`, { method: 'POST', body: payload });
export const returnBooking = (id) => api(`${RENTAL_BASE}/bookings/${id}/return`, { method: 'PATCH' });
