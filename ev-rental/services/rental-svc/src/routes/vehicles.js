const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');


const prisma = new PrismaClient();
const r = Router();

r.get('/', requireAuth(['RENTER','STAFF','ADMIN']), async (req, res) => {
  try {
    const { stationId, available } = req.query || {};
    const where = {};
    if (stationId) where.stationId = String(stationId);
    if (typeof available !== 'undefined') {
      const b = String(available).toLowerCase();
      if (b === 'true' || b === '1') where.isAvailable = true;
      if (b === 'false' || b === '0') where.isAvailable = false;
    }
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { name: 'asc' } });
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

r.get('/:id', requireAuth(['RENTER','STAFF','ADMIN']), async (req, res) => {
  const v = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'OK', data: v });
});

module.exports = r;
