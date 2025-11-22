import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL
const AUTH_FRONTEND_URL = 'http://localhost:8060'; // Auth UI (Docker)
const DISABLE_AUTH = false; // Enable SSO authentication

const isPublicAccess = () => {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.has('bookingId') || url.searchParams.get('vnp_status') === 'success';
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user from cookie (SSO)
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    if (DISABLE_AUTH) {
      setIsLoading(false);
      return;
    }

    // Nếu là public access (có bookingId hoặc vnp_status), skip auth check
    if (isPublicAccess()) {
      console.log('🔵 [BILLING] Public access detected, skipping auth check');
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/v1/auth/me`;
      console.log('🔵 [BILLING API CALL]', {
        method: 'GET',
        url: url,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Quan trọng: gửi cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          const user = data.data.user;
          setCurrentUser({
            id: user.id,
            name: user.fullName || 'User',
            role: user.role as UserRole
          });
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

  const login = async (email: string, password: string) => {
    if (DISABLE_AUTH) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/v1/auth/login`;
      const body = { email, password };
      
      console.log('🔵 [BILLING API CALL]', {
        method: 'POST',
        url: url,
        body: { email, password: '***' }, // Ẩn password
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Gửi và nhận cookie
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Cookie đã được set, fetch lại user
        await fetchCurrentUser();
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (DISABLE_AUTH) {
      return;
    }

    try {
      // Gọi API logout để xóa cookie
      const url = `${API_BASE_URL}/api/v1/auth/logout`;
      console.log('🔵 [BILLING API CALL]', {
        method: 'POST',
        url: url,
        timestamp: new Date().toISOString()
      });
      
      await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear user state
    setCurrentUser(null);
    setError(null);
    
    // Redirect to auth frontend
    window.location.href = `${AUTH_FRONTEND_URL}/login`;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { UserRole };
