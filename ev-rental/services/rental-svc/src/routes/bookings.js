const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const r = express.Router();

// Tạo đặt xe mới
r.post('/', async (req, res) => {
  const { vehicleId, stationId: stationIdInput, startTime, estDurationH } = req.body || {};
  const userId = String((req.body && req.body.userId) || 'dev-user');
  console.log('BODY DEBUG:', req.body);

  if (!vehicleId || !startTime) {
    return res.status(400).json({ error: 'vehicleId and startTime are required' });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found' });
    }

    if (stationIdInput && stationIdInput !== vehicle.stationId) {
      return res.status(400).json({ error: 'Vehicle does not belong to provided stationId' });
    }

    const stationId = vehicle.stationId;
    const start = new Date(startTime);
    const estimateH = Number(estDurationH || 1);
    const priceEstimate = (vehicle.pricePerHour || 0) * estimateH;

    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          userId,
          vehicleId,
          stationId,
          startTime: start,
          status: 'PENDING',
          priceEstimate,
        },
      }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: { isAvailable: false } }),
    ]);

    res.status(201).json(booking);
  } catch (err) {
    console.error('BOOKING ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trả xe
r.patch('/:id/return', async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'RETURNED',
        endTime: new Date(),
      },
    });
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { isAvailable: true },
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = r;
