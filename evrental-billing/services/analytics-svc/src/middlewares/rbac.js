export function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }
    next();
  };
}

export function scopeStation(req, res, next) {
  if (req.user?.role === 'STAFF') {
    const userStationIds = req.user.stationIds || [];
    const stationId = req.query.stationId || req.params.stationId;
    
    if (stationId && !userStationIds.includes(stationId)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }
    
    // Add station filter for staff
    req.stationFilter = userStationIds;
  }
  next();
}

export function scopeUser(req, res, next) {
  if (req.user?.role === 'RENTER') {
    const userId = req.user.id;
    const targetUserId = req.params.renterId;
    
    if (userId !== targetUserId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }
  }
  next();
}
