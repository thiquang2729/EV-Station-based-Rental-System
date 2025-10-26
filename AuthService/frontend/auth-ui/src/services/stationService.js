// frontend/auth-ui/src/services/stationService.js
import axios from 'axios';

import { getApiBaseUrl, clearApiBaseUrlOverride } from "@/config/apiConfig";

// Clear any cached API base URL to ensure we use the latest configuration
clearApiBaseUrlOverride();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const stationService = {
  // Get all stations (load balanced through Kong)
  getStations: async () => {
    try {
      const response = await apiClient.get("/api/v1/stations");
      return response.data;
    } catch (error) {
      console.error("Error fetching stations:", error);
      throw error;
    }
  },

  // Get station by ID
  getStationById: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/stations/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching station:", error);
      throw error;
    }
  },

  // Get stations from specific port
  getStationsFromPort: async (port) => {
    try {
      const response = await apiClient.get(`/api/v1/stations/port${port}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching stations from port ${port}:`, error);
      throw error;
    }
  },

  // Health check for all station ports
  checkStationHealth: async () => {
    try {
      const [port1, port2, port3] = await Promise.all([
        apiClient
          .get("/api/v1/stations/port1/health")
          .catch(() => ({ data: { status: "down" } })),
        apiClient
          .get("/api/v1/stations/port2/health")
          .catch(() => ({ data: { status: "down" } })),
        apiClient
          .get("/api/v1/stations/port3/health")
          .catch(() => ({ data: { status: "down" } }))
      ]);

      return {
        port1: port1.data,
        port2: port2.data,
        port3: port3.data
      };
    } catch (error) {
      console.error("Error checking station health:", error);
      throw error;
    }
  },

  // Test load balancing
  testLoadBalancing: async () => {
    try {
      const requests = Array(10)
        .fill()
        .map(() =>
          apiClient
            .get("/api/v1/stations")
            .catch(() => ({ data: { error: "failed" } }))
        );

      const responses = await Promise.all(requests);
      return responses.map((response, index) => ({
        request: index + 1,
        status: response.data.error ? "failed" : "success",
        data: response.data
      }));
    } catch (error) {
      console.error("Error testing load balancing:", error);
      throw error;
    }
  },

  // Get Kong Gateway status
  getKongStatus: async () => {
    try {
      const response = await apiClient.get("/kong-health");
      return response.data;
    } catch (error) {
      console.error("Error fetching Kong status:", error);
      throw error;
    }
  }
};

export default stationService;
