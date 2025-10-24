import { ADMIN_BASE } from '../lib/constants';
import { api } from '../lib/apiClient';

export const listAdminVehicles = () => api(`${ADMIN_BASE}/vehicles`);
export const listReports       = () => api(`${ADMIN_BASE}/reports`);
export const resolveReport     = (id) => api(`${ADMIN_BASE}/reports/${id}`, { method: 'PUT' });

