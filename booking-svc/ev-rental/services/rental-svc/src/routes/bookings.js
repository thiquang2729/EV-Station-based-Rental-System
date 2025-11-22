const express = require('express');
const prisma = require('../prisma');
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
  
  // Lấy userId từ req.user (đã được extract từ headers bởi middleware)
  // Fallback: nếu không có req.user thì lấy từ body hoặc dùng dev-user
  const userId = String(
    req.user?.id || 
    req.user?.sub || 
    (req.body && req.body.userId) || 
    'dev-user'
  );
  
  console.log('BODY DEBUG:', req.body);
  console.log('USER INFO:', { userId, user: req.user });
  console.log('STATION ID DEBUG:', { stationIdInput, vehicleId });

  if (!vehicleId || !startTime) {
    return res.status(400).json({ error: 'vehicleId and startTime are required' });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(400).json({ error: 'Vehicle not found' });
    }

    // Cho phép nhận xe từ mọi trạm
    // Nếu có stationIdInput, kiểm tra trạm có tồn tại không, rồi dùng nó
    // Nếu không có stationIdInput, dùng trạm của xe
    let stationId;
    let stationName = null;
    if (stationIdInput) {
      // Kiểm tra trạm có tồn tại không
      const station = await prisma.station.findUnique({ where: { id: stationIdInput } });
      if (!station) {
        return res.status(400).json({ error: 'Station not found' });
      }
      // Dùng stationId từ request (cho phép nhận xe từ mọi trạm)
      stationId = stationIdInput;
      stationName = station.name;
      console.log('Using stationId from request (pickup station):', stationId, 'Station name:', stationName, 'Vehicle belongs to:', vehicle.stationId);
    } else {
      // Nếu không có stationIdInput, dùng trạm của xe
      stationId = vehicle.stationId;
      // Lấy tên trạm từ vehicle.station relation
      const station = await prisma.station.findUnique({ where: { id: stationId } });
      if (station) {
        stationName = station.name;
      }
      console.log('Using stationId from vehicle (default):', stationId, 'Station name:', stationName);
    }

    if (!vehicle.isAvailable) {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }
    const start = new Date(startTime);
    const estimateH = Number(estDurationH || 1);
    const priceEstimate = (vehicle.pricePerDay || 0) * (estimateH / 24);

    // Tạo booking với status PENDING - CHƯA khóa xe
    // Xe chỉ khóa khi thanh toán thành công (nhận message từ RabbitMQ)
    const booking = await prisma.booking.create({
      data: {
        userId,
        vehicleId,
        stationId,
        startTime: start,
        status: 'PENDING',
        priceEstimate,
      },
    });
    // KHÔNG khóa xe ở đây - chỉ khóa khi thanh toán thành công qua RabbitMQ

    // Gửi yêu cầu tạo ý định thanh toán sang payment-svc qua MQ (không chặn response)
    publishPaymentIntentRequest({ 
      bookingId: booking.id, 
      userId, 
      stationId, 
      stationName: stationName || 'Unknown Station',
      amount: priceEstimate 
    })
      .catch((e) => console.error('publish intent request failed:', e.message));

    res.status(201).json(booking);
  } catch (err) {
    console.error('BOOKING ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Xác nhận đã thanh toán cho booking
// LƯU Ý: Endpoint này chỉ cập nhật booking status, KHÔNG khóa xe
// Xe chỉ khóa khi nhận message từ RabbitMQ (trong mq.js handlePaymentSucceeded)
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

    // CHỈ cập nhật booking status, KHÔNG khóa xe
    // Xe sẽ được khóa bởi RabbitMQ consumer khi nhận message payment.succeeded
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        paymentId: String(paymentId),
        confirmedAt: new Date()
      }
    });

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

