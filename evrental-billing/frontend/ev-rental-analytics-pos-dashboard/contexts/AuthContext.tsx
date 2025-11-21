import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUserFromToken } from '../utils/jwt';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

interface LoginResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

const API_BASE_URL = 'http://localhost:9080'; // Gateway URL
const DISABLE_AUTH = true; // Temporary override while auth service is unavailable

const AUTH_DISABLED_USER: User = {
  id: 'demo-admin',
  name: 'Demo Admin',
  role: UserRole.ADMIN,
};

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (DISABLE_AUTH) {
      return AUTH_DISABLED_USER;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on app load
  useEffect(() => {
    if (DISABLE_AUTH) {
      return;
    }

    // Try to get token from multiple sources (compatibility with auth frontend)
    let token = localStorage.getItem('accessToken');
    let userInfo: any = null;
    
    // Check if auth frontend stored token in 'auth_state' (Redux persist)
    if (!token) {
      const authState = localStorage.getItem('auth_state');
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          token = parsed.accessToken;
          if (parsed.user) {
            userInfo = parsed.user;
          }
        } catch (e) {
          console.warn('Failed to parse auth_state:', e);
        }
      }
    }
    
    if (token) {
      // Decode token to get user info
      const tokenUser = getUserFromToken(token);
      if (tokenUser) {
        // Priority 1: Use fullName from token (if available)
        if (tokenUser.fullName) {
          setCurrentUser({
            id: tokenUser.id,
            name: tokenUser.fullName,
            role: tokenUser.role as UserRole
          });
          // Save to localStorage for consistency
          localStorage.setItem('userInfo', JSON.stringify({
            fullName: tokenUser.fullName,
            name: tokenUser.fullName
          }));
          return;
        }
        
        // Priority 2: If we have user info from auth_state, use it
        if (userInfo && userInfo.fullName) {
          setCurrentUser({
            id: tokenUser.id,
            name: userInfo.fullName,
            role: tokenUser.role as UserRole
          });
          // Save to our format for consistency
          localStorage.setItem('userInfo', JSON.stringify({
            fullName: userInfo.fullName,
            name: userInfo.fullName
          }));
          // Also save token in our format
          localStorage.setItem('accessToken', token);
          return;
        }
        
        // Priority 3: Try to get full user info from localStorage
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          try {
            const saved = JSON.parse(savedUserInfo);
            setCurrentUser({
              id: tokenUser.id,
              name: saved.fullName || saved.name || 'User',
              role: tokenUser.role as UserRole
            });
          } catch (e) {
            // If saved info is invalid, fetch from API
            fetchUserInfo(tokenUser.id, token);
          }
        } else {
          // Priority 4: Fetch user info from API
          fetchUserInfo(tokenUser.id, token);
        }
      } else {
        // Token invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('auth_state');
      }
    }
  }, []);

  const fetchUserInfo = async (userId: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        const userInfo = {
          id: userData.id || userId,
          name: userData.fullName || userData.name || 'User',
          role: userData.role as UserRole
        };
        
        // Save user info to localStorage
        localStorage.setItem('userInfo', JSON.stringify({
          fullName: userInfo.name,
          name: userInfo.name
        }));
        
        setCurrentUser(userInfo);
      } else {
        // If API fails, use token info only
        const tokenUser = getUserFromToken(token);
        if (tokenUser) {
          setCurrentUser({
            id: tokenUser.id,
            name: 'User', // Fallback name
            role: tokenUser.role as UserRole
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // Fallback to token info only
      const tokenUser = getUserFromToken(token);
      if (tokenUser) {
        setCurrentUser({
          id: tokenUser.id,
          name: 'User', // Fallback name
          role: tokenUser.role as UserRole
        });
      }
    }
  };

  const login = async (email: string, password: string) => {
    if (DISABLE_AUTH) {
      setError(null);
      setCurrentUser(AUTH_DISABLED_USER);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user, accessToken, refreshToken } = data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Decode token to get fullName (if included in token)
        const tokenUser = getUserFromToken(accessToken);
        const userName = tokenUser?.fullName || user.fullName;
        
        // Store user info for later use
        localStorage.setItem('userInfo', JSON.stringify({
          fullName: userName,
          name: userName
        }));
        
        // Set user in context
        setCurrentUser({
          id: user.id,
          name: userName,
          role: user.role as UserRole
        });
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

  const logout = () => {
    if (DISABLE_AUTH) {
      setCurrentUser(AUTH_DISABLED_USER);
      setError(null);
      return;
    }

    // Clear tokens and user info from all possible storage keys
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('auth_state'); // Clear auth frontend's storage too
    
    // Clear user state
    setCurrentUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export { UserRole };
