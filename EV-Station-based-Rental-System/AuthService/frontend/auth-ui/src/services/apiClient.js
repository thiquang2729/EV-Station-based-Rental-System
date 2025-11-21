import axios from "axios";
import { buildApiUrl, clearApiBaseUrlOverride } from "@/config/apiConfig";

// Clear any cached API base URL to ensure we use the latest configuration
clearApiBaseUrlOverride();

const apiClient = axios.create({
  baseURL: buildApiUrl("/api/v1"),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to log the actual URL being called
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    console.log('Request Headers:', {
      Authorization: config.headers?.Authorization ? config.headers.Authorization.substring(0, 30) + '...' : 'NOT SET',
      'Content-Type': config.headers?.['Content-Type'],
      allHeaders: config.headers
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
