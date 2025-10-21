import axios from "axios";
import { buildApiUrl } from "@/config/apiConfig";

const apiClient = axios.create({
  baseURL: buildApiUrl("/api/v1"),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
