import { RENTAL_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listStations = () => api(`${RENTAL_BASE}/stations`);
export const listVehicles = () => api(`${RENTAL_BASE}/vehicles`);
export const getVehicle = (id) => api(`${RENTAL_BASE}/vehicles/${id}`);
export const listBookings = () => api(`${RENTAL_BASE}/bookings`);
export const createBooking = (payload) => api(`${RENTAL_BASE}/bookings`, { method: 'POST', body: payload });
export const returnBooking = (id) => api(`${RENTAL_BASE}/bookings/${id}/return`, { method: 'PATCH' });