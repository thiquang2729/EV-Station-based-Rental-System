function requireAuth() {
  return (req, _res, next) => {
    // Extract user info from headers (forwarded by APISIX gateway)
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    if (userId) {
      // User info từ APISIX gateway (đã verify token)
      req.user = {
        id: userId,
        sub: userId,
        role: userRole || 'RENTER',
        roles: userRole ? [userRole] : ['RENTER']
      };
    } else {
      // Fallback cho development (không có gateway hoặc public routes)
      // Trong production, nên reject request không có userId
      req.user = { 
        id: 'dev-user',
        sub: 'dev-user', 
        roles: ['RENTER', 'STAFF', 'ADMIN'] 
      };
      console.warn('[AUTH] No X-User-Id header found, using dev-user fallback');
    }
    
    next();
  };
}

module.exports = { requireAuth };
