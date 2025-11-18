import { FLEET_BASE, FLEET_DIRECT } from '../lib/constants';
import { api } from '../lib/apiClient';

// Use direct service URL for Docker environment
const FLEET_API = FLEET_DIRECT;

export const listFleetVehicles   = () => api(`${FLEET_API}/vehicles`);
export const getFleetVehicle     = (id) => api(`${FLEET_API}/vehicles/${id}`);
export const updateVehicleStatus = (id, data) => api(`${FLEET_API}/vehicles/${id}/status`, { method: 'PUT', body: data });
export const updateFleetVehicle  = (id, data) => api(`${FLEET_API}/vehicles/${id}`, { method: 'PUT', body: data });
export const createFleetVehicle  = (data) => api(`${FLEET_API}/vehicles`, { method: 'POST', body: data });
export const deleteFleetVehicle  = (id) => api(`${FLEET_API}/vehicles/${id}`, { method: 'DELETE' });

export const listIncidents  = () => api(`${FLEET_API}/incidents`);
export const createIncident = (payload) => api(`${FLEET_API}/incidents`, { method: 'POST', body: payload });
export const resolveIncident = (id) => api(`${FLEET_API}/incidents/${id}/resolve`, { method: 'PUT' });

export const getOverview = () => api(`${FLEET_API}/overview`);

// Presign upload for S3 images
export const presignUpload = (payload) => api(`${FLEET_API}/uploads/presign`, { method: 'POST', body: payload });
