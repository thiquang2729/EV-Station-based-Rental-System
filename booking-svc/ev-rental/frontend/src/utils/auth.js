/**
 * Check if a user has admin access
 * @param {Object} user - User object from auth context
 * @returns {boolean} - True if user has admin access
 */
export const hasAdminAccess = (user) => {
  if (!user) return false;
  
  // Check if user has admin role
  if (user.role === 'ADMIN' || user.role === 'admin') {
    return true;
  }
  
  // Check if user has admin in roles array (if roles is an array)
  if (Array.isArray(user.roles)) {
    return user.roles.some(role => 
      role === 'ADMIN' || 
      role === 'admin' || 
      role.toLowerCase() === 'admin'
    );
  }
  
  return false;
};
