import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserFromToken, getAccessToken, setTokens, clearTokens, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext();

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
    // Kiểm tra token khi component mount
    const token = getAccessToken();
    if (token) {
      if (!isTokenExpired(token)) {
        const userInfo = getUserFromToken(token);
        if (userInfo) {
          setCurrentUser(userInfo);
        }
      } else {
        // Token hết hạn, xóa đi
        clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    const userInfo = getUserFromToken(accessToken);
    if (userInfo) {
      setCurrentUser(userInfo);
    }
  };

  const logout = () => {
    clearTokens();
    setCurrentUser(null);
    // Redirect to auth service login page
    window.location.href = 'http://localhost:3002/login';
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

