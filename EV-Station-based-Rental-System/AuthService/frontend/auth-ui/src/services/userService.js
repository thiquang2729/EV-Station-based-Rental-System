import apiClient from './apiClient';

const userService = {
  // Fetch users with advanced filters
  async fetchUsers({ page = 1, riskStatus = null, search = null, role = null, verificationStatus = null, dateFrom = null, dateTo = null, accessToken }) {
    try {
      let url = `/users?page=${page}`;
      if (riskStatus) url += `&riskStatus=${encodeURIComponent(riskStatus)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (role) url += `&role=${encodeURIComponent(role)}`;
      if (verificationStatus) url += `&verificationStatus=${encodeURIComponent(verificationStatus)}`;
      if (dateFrom) url += `&dateFrom=${encodeURIComponent(dateFrom)}`;
      if (dateTo) url += `&dateTo=${encodeURIComponent(dateTo)}`;
      
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Delete user (for admin)
  async deleteUser({ userId, accessToken }) {
    try {
      const response = await apiClient.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  },

  // Get user statistics (for admin)
  async getUserStats(accessToken) {
    try {
      const response = await apiClient.get('/users/stats', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },

  // Get user registration statistics by date (for admin)
  async getUserRegistrationStats(period = '7d', accessToken) {
    try {
      const response = await apiClient.get(`/users/registration-stats?period=${period}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Get user registration stats error:', error);
      throw error;
    }
  },

  // Get user by ID (for admin)
  async getUserById({ userId, accessToken }) {
    try {
      const response = await apiClient.get(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  },

  // Update user (for admin)
  async updateUser({ userId, userData, accessToken }) {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  // Update current user profile
  async updateProfile({ fullName, phoneNumber, accessToken }) {
    try {
      const response = await apiClient.put(
        '/users/profile/me',
        {
          fullName,
          phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};

export default userService;
