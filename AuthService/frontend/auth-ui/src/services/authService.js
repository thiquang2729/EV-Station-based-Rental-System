import apiClient from "./apiClient";

export const register = async (payload) => {
  const response = await apiClient.post("/auth/register", payload);
  return response.data;
};

export const login = async (payload) => {
  const response = await apiClient.post("/auth/login", payload);
  return response.data;
};

export const logout = async (accessToken) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.post("/auth/logout", {}, config);
  return response.data;
};

export const refreshSession = async () => {
  const response = await apiClient.post("/auth/refresh", {});
  return response.data;
};
