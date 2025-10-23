import { FLEET_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';
// Vehicles in fleet service
export const listFleetVehicles = () => api(`${FLEET_BASE}/vehicles`);
export const getFleetVehicle = (id) => api(`${FLEET_BASE}/vehicles/${id}`);
export const updateVehicleStatus = (id, data) => api(`${FLEET_BASE}/vehicles/${id}/status`, { method: 'PUT', body: data });
// Incidents
export const listIncidents = () => api(`${FLEET_BASE}/incidents`);
export const createIncident = (payload) => api(`${FLEET_BASE}/incidents`, { method: 'POST', body: payload });
// Overview dashboard
export const getOverview = () => api(`${FLEET_BASE}/overview`);