import { FLEET_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listFleetVehicles   = () => api(`${FLEET_BASE}/vehicles`);
export const getFleetVehicle     = (id) => api(`${FLEET_BASE}/vehicles/${id}`);
export const updateVehicleStatus = (id, data) => api(`${FLEET_BASE}/vehicles/${id}/status`, { method: 'PUT', body: data });
export const updateFleetVehicle  = (id, data) => api(`${FLEET_BASE}/vehicles/${id}`, { method: 'PUT', body: data });
export const createFleetVehicle  = (data) => api(`${FLEET_BASE}/vehicles`, { method: 'POST', body: data });
export const deleteFleetVehicle  = (id) => api(`${FLEET_BASE}/vehicles/${id}`, { method: 'DELETE' });

export const listIncidents  = () => api(`${FLEET_BASE}/incidents`);
export const createIncident = (payload) => api(`${FLEET_BASE}/incidents`, { method: 'POST', body: payload });

export const getOverview = () => api(`${FLEET_BASE}/overview`);

// Presign upload for S3 images
export const presignUpload = (payload) => api(`${FLEET_BASE}/uploads/presign`, { method: 'POST', body: payload });
