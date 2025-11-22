import { RevenueDataPoint, UtilizationDataPoint, StationReport } from '../types';

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL

/**
 * Gets the fetch options for cookie-based authentication (SSO)
 */
const getFetchOptions = (method: string = 'GET', body?: any) => {
  const options: RequestInit = {
    method,
    credentials: 'include', // Quan trọng: gửi cookie để SSO hoạt động
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }
  
  return options;
};

/**
 * Wrapper function để log tất cả API calls
 */
const logApiCall = (url: string, method: string, body?: any) => {
  console.log('🔵 [BILLING API CALL]', {
    method: method.toUpperCase(),
    url: url,
    body: body ? JSON.parse(JSON.stringify(body)) : undefined,
    timestamp: new Date().toISOString()
  });
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

  const url = `${API_BASE_URL}/api/v1/analytics/revenue?${params}`;
  logApiCall(url, 'GET');
  const response = await fetch(url, getFetchOptions('GET'));

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

  const url = `${API_BASE_URL}/api/v1/analytics/revenue-daily?${params}`;
  logApiCall(url, 'GET');
  const response = await fetch(url, getFetchOptions('GET'));

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

  const url = `${API_BASE_URL}/api/v1/analytics/utilization?${params}`;
  logApiCall(url, 'GET');
  const response = await fetch(url, getFetchOptions('GET'));

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

  const url = `${API_BASE_URL}/api/v1/reports/stations?${params}`;
  logApiCall(url, 'GET');
  const response = await fetch(url, getFetchOptions('GET'));

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

  const url = `${API_BASE_URL}/api/v1/analytics/peak-hours?${params}`;
  logApiCall(url, 'GET');
  const response = await fetch(url, getFetchOptions('GET'));

  if (!response.ok) {
    throw new Error('Failed to fetch peak hours data');
  }

  const data = await response.json();
  return data.data || [];
};
