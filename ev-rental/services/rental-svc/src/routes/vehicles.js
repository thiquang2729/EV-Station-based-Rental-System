const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');


const prisma = new PrismaClient();
const r = Router();

r.get('/:id', requireAuth(['RENTER','STAFF','ADMIN']), async (req, res) => {
  const v = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!v) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'OK', data: v });
});

module.exports = r;
