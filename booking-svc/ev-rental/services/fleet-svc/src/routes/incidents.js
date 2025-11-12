const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const r = Router();
//Lấy danh sách tất cả sự cố

r.get('/', async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      message: 'Fetched all incidents successfully',
      data: incidents,
    });
  } catch (err) {
    console.error('❌ Error fetching incidents:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});


//Bao cao su co xe
// Báo cáo sự cố xe
r.post('/', requireAuth(['STAFF', 'ADMIN']), async (req, res) => {
  try {
    const { vehicleId, stationId, reporterId, severity, desc, photos } = req.body;

    const incident = await prisma.incident.create({
      data: {
        vehicleId,
        stationId,
        reporterId,
        severity,
        desc,
        photos,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: incident,
    });
  } catch (err) {
    console.error('❌ Error creating incident:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});


module.exports = r;
