import apiClient from "./apiClient";

// Create complaint (Any authenticated user)
export const createComplaint = async ({ renterId, details, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const payload = { details };
  if (renterId) {
    payload.renterId = renterId;
  }

  try {
    const response = await apiClient.post("/complaints", payload, config);
    return response.data;
  } catch (error) {
    console.error("createComplaint error:", error);
    throw error;
  }
};

// Get all complaints with pagination (STAFF/ADMIN only)
export const getAllComplaints = async ({ page = 1, status = null, accessToken } = {}) => {
  const config = {
    params: { page },
  };
  
  if (status) {
    config.params.status = status;
  }
  
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/complaints", config);
  return response.data;
};

// Get complaint by ID (STAFF/ADMIN only)
export const getComplaintById = async ({ complaintId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get(`/complaints/${complaintId}`, config);
  return response.data;
};

// Get complaints by renter ID (User can see their own, STAFF/ADMIN can see all)
export const getComplaintsByRenterId = async ({ renterId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get(`/complaints/renter/${renterId}`, config);
  return response.data;
};

// Update complaint (STAFF/ADMIN only)
export const updateComplaint = async ({ complaintId, payload, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.put(`/complaints/${complaintId}`, payload, config);
  return response.data;
};

// Delete complaint (ADMIN only)
export const deleteComplaint = async ({ complaintId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.delete(`/complaints/${complaintId}`, config);
  return response.data;
};

// Get complaint statistics (STAFF/ADMIN only)
export const getComplaintStats = async ({ accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/complaints/stats", config);
  return response.data;
};

