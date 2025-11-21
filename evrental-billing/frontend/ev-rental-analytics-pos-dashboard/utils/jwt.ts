/**
 * Decode JWT token without verification (client-side only)
 * Note: This does NOT verify the signature, only decodes the payload
 */
export const decodeJWT = (token: string): any | null => {
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
export const getUserFromToken = (token: string): { id: string; role: string; fullName?: string } | null => {
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

