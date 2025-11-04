import { ADMIN_BASE, ADMIN_DIRECT } from '../lib/constants';
import { api } from '../lib/apiClient';

// Use direct service URL for Docker environment
const ADMIN_API = ADMIN_DIRECT;

export const listAdminVehicles = () => api(`${ADMIN_API}/vehicles`);
export const listReports       = () => api(`${ADMIN_API}/reports`);
export const resolveReport     = (id) => api(`${ADMIN_API}/reports/${id}`, { method: 'PUT' });

