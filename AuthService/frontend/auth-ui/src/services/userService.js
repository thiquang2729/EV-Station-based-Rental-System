import apiClient from "./apiClient";

export const getUserStats = async (accessToken) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/users/stats", config);
  return response.data?.data ?? response.data;
};

export const fetchUsers = async ({ page = 1, riskStatus, accessToken } = {}) => {
  const params = { page };
  if (riskStatus) params.riskStatus = riskStatus;
  const config = { params };
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/users", config);
  return response.data;
};

export const getUserById = async ({ userId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get(`/users/${userId}`, config);
  return response.data;
};

export const updateUser = async ({ userId, userData, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.put(`/users/${userId}`, userData, config);
  return response.data;
};

export const deleteUser = async ({ userId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.delete(`/users/${userId}`, config);
  return response.data;
};
