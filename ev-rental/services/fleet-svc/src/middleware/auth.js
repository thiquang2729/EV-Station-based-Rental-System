function requireAuth() {
  return (req, _res, next) => {
    // Always allow; provide a default user so downstream code works
    if (!req.user) req.user = { sub: 'dev-user', roles: ['RENTER', 'STAFF', 'ADMIN'] };
    next();
  };
}

module.exports = { requireAuth };
