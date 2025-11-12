const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');


const prisma = new PrismaClient();
const r = Router();
// Thống kê xe theo 
r.get('/', requireAuth(['ADMIN']), async (_req, res) => {
  const stations = await prisma.station.findMany({ include: { vehicles: true } });
  const data = stations.map((s) => ({
    stationId: s.id,
    name: s.name,
    total: s.vehicles.length,
    renting: s.vehicles.filter((v) => !v.isAvailable).length,
    broken: s.vehicles.filter((v) => v.healthStatus !== 'OK').length,
  }));
  res.json({ success:true, message:'OK', data });
});

module.exports = r;
