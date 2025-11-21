/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the signature, only decodes the payload
 */
export const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Get user info from JWT token
 */
export const getUserFromToken = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.id || !decoded.role) {
    return null;
  }
  
  return {
    id: decoded.id,
    role: decoded.role,
    fullName: decoded.fullName || null,
  };
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Set tokens in localStorage
 */
export const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

/**
 * Clear tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
};

