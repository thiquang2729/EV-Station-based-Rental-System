import { RevenueDataPoint, UtilizationDataPoint, StationReport } from '../types';

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL

/**
 * Gets the authorization header with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Fetches revenue data from the analytics service
 */
export const getRevenueData = async (
  stationId?: string,
  from?: string,
  to?: string,
  granularity: 'day' | 'week' | 'month' = 'day'
): Promise<RevenueDataPoint[]> => {
  const params = new URLSearchParams();
  if (stationId) params.append('stationId', stationId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('granularity', granularity);

  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/revenue?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch revenue data');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Fetches aggregated revenue daily (from RevenueDaily table via NiFi)
 */
export const getRevenueDaily = async (
  from: string,
  to: string
): Promise<{ date: string; total: number }[]> => {
  const params = new URLSearchParams();
  params.append('from', from);
  params.append('to', to);

  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/revenue-daily?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch revenue daily');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Fetches utilization data from the analytics service
 */
export const getUtilizationData = async (
  stationId?: string,
  from?: string,
  to?: string
): Promise<UtilizationDataPoint[]> => {
  const params = new URLSearchParams();
  if (stationId) params.append('stationId', stationId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/utilization?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch utilization data');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Fetches station reports from the analytics service
 */
export const getStationReports = async (
  date?: string,
  format: 'json' | 'csv' = 'json'
): Promise<StationReport[]> => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('format', format);

  const response = await fetch(`${API_BASE_URL}/api/v1/reports/stations?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch station reports');
  }

  const data = await response.json();
  return data.data || [];
};

/**
 * Fetches peak hours data from the analytics service
 */
export const getPeakHoursData = async (
  stationId?: string,
  from?: string,
  to?: string
): Promise<number[]> => {
  const params = new URLSearchParams();
  if (stationId) params.append('stationId', stationId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/peak-hours?${params}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch peak hours data');
  }

  const data = await response.json();
  return data.data || [];
};
