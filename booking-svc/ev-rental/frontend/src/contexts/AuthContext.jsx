import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

// API Gateway URL - tất cả requests đi qua đây để SSO hoạt động
const GATEWAY_URL = 'http://localhost:9080';
const AUTH_FRONTEND_URL = 'http://localhost:8060'; // Auth UI chạy ở port 8060 (Docker)

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch current user from cookie (SSO)
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/v1/auth/me`, {
        method: 'GET',
        credentials: 'include', // Quan trọng: gửi cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          setCurrentUser(data.data.user);
        }
      } else {
        // User chưa đăng nhập hoặc token hết hạn
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    // Sau khi auth service redirect về, fetch lại user
    await fetchCurrentUser();
  };

  const logout = async () => {
    try {
      // Gọi API logout để xóa cookie
      await fetch(`${GATEWAY_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setCurrentUser(null);
    // Redirect to auth frontend (Docker port 8060)
    window.location.href = `${AUTH_FRONTEND_URL}/login`;
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

