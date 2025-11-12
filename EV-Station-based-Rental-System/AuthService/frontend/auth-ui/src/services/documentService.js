import apiClient from "./apiClient";

// Upload document
export const uploadDocument = async ({ file, documentType, accessToken } = {}) => {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", documentType);

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await apiClient.post("/upload/document", formData, config);
  return response.data;
};

// Get documents by user ID
export const getDocumentsByUserId = async ({ userId, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get(`/documents/user/${userId}`, config);
  return response.data;
};

// Get pending documents (Admin only)
export const getPendingDocuments = async ({ accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/documents/pending", config);
  return response.data;
};

// Update document status (Admin only)
export const updateDocumentStatus = async ({ documentId, status, accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.patch(
    `/documents/${documentId}/status`,
    { status },
    config
  );
  return response.data;
};

// Get document statistics (Admin only)
export const getDocumentStats = async ({ accessToken } = {}) => {
  const config = {};
  if (accessToken) {
    config.headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  const response = await apiClient.get("/documents/stats", config);
  return response.data;
};

