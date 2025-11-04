import axios from "axios";
import { buildApiUrl, getApiBaseUrl, clearApiBaseUrlOverride } from "@/config/apiConfig";

// Clear any cached API base URL to ensure we use the latest configuration
clearApiBaseUrlOverride();

const normalize = (value) =>
  value ? value.replace(/\/+$/, "") : value;

const EXTERNAL_BASE_URL =
  normalize(import.meta.env.VITE_RENTAL_SERVICE_BASE_URL) ?? getApiBaseUrl();
const AUTH_BACKEND_BASE_URL = getApiBaseUrl();

export async function fetchStations() {
  try {
    const res = await axios.get(`${EXTERNAL_BASE_URL}/api/v1/stations`, { timeout: 3000 });
    // Normalize to array of stations
    const data = Array.isArray(res.data) ? res.data : res.data?.data;
    if (!Array.isArray(data)) throw new Error("Invalid station format from external service");
    return data;
  } catch (err) {
    // Fallback to mock endpoint in auth backend
    const res = await axios.get(buildApiUrl("/api/v1/stations"));
    const data = Array.isArray(res.data) ? res.data : res.data?.data;
    return Array.isArray(data) ? data : [];
  }
}


