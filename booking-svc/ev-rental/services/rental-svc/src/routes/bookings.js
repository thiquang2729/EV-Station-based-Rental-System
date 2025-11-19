const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { publishPaymentIntentRequest } = require('../mq');
const r = express.Router();

// Danh sách booking (mặc định mới nhất trước)
r.get('/', async (_req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    if (!vehicle.isAvailable) {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    const stationId = vehicle.stationId;
    const start = new Date(startTime);
    const estimateH = Number(estDurationH || 1);
    const priceEstimate = (vehicle.pricePerDay || 0) * (estimateH / 24);

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId,
          vehicleId,
          stationId,
          startTime: start,
          status: 'PENDING',
          priceEstimate,
        },
      });
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { isAvailable: false },
      });
      return created;
    });

    // Gửi yêu cầu tạo ý định thanh toán sang payment-svc qua MQ (không chặn response)
    publishPaymentIntentRequest({ bookingId: booking.id, userId, stationId, amount: priceEstimate })
      .catch((e) => console.error('publish intent request failed:', e.message));

    res.status(201).json(booking);
  } catch (err) {
    console.error('BOOKING ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Xác nhận đã thanh toán cho booking
r.post('/:id/mark-paid', async (req, res) => {
  const { id } = req.params;
  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status !== 'PENDING') {
      return res.status(409).json({ error: 'Invalid booking state' });
    }

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          paymentId: String(paymentId),
          confirmedAt: new Date()
        }
      }),
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { isAvailable: false }
      })
    ]);

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('MARK PAID ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
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

