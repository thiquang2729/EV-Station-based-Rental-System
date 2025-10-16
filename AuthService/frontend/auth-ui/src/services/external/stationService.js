import axios from "axios";

const EXTERNAL_BASE_URL = "http://localhost:3002"; // service khác
const AUTH_BACKEND_BASE_URL = "http://localhost:8000"; // backend hiện tại (fallback)

export async function fetchStations() {
  try {
    const res = await axios.get(`${EXTERNAL_BASE_URL}/api/v1/stations`, { timeout: 3000 });
    // Normalize to array of stations
    const data = Array.isArray(res.data) ? res.data : res.data?.data;
    if (!Array.isArray(data)) throw new Error("Invalid station format from external service");
    return data;
  } catch (err) {
    // Fallback to mock endpoint in auth backend
    const res = await axios.get(`${AUTH_BACKEND_BASE_URL}/api/v1/stations`);
    const data = Array.isArray(res.data) ? res.data : res.data?.data;
    return Array.isArray(data) ? data : [];
  }
}


