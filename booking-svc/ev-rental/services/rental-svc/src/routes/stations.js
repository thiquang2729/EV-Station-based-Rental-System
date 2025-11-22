const express = require('express');
const prisma = require('../prisma');
const { generateShortId } = require('../utils/idGenerator');
const r = express.Router();

// Lấy danh sách điểm thuê
r.get('/', async (_req, res) => {
  try {
    const stations = await prisma.station.findMany();
    res.json(stations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lấy chi tiết 1 điểm thuê
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const station = await prisma.station.findUnique({
      where: { id: String(id) }, // Station ID luôn là String
    });
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new station
r.post('/', async (req, res) => {
  try {
    const { name, address, lat, lng, id } = req.body || {};
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'name, lat, lng là bắt buộc' });
    }
    
    // Generate short ID nếu không được cung cấp
    let stationId = id ? String(id) : null;
    if (!stationId) {
      // Tạo ID ngắn gọn và kiểm tra trùng lặp
      let attempts = 0;
      do {
        stationId = generateShortId('ST');
        const existing = await prisma.station.findUnique({ where: { id: stationId } });
        if (!existing) break;
        attempts++;
        if (attempts > 10) {
          // Fallback về cuid (Prisma tự tạo) nếu quá nhiều lần trùng
          stationId = null;
          break;
        }
      } while (true);
    }
    
    const createData = {
      name: String(name),
      address: address ? String(address) : '',
      lat: Number(lat),
      lng: Number(lng),
    };
    
    // Chỉ set id nếu đã tạo được ID ngắn gọn
    if (stationId) {
      createData.id = stationId;
    }
    
    const station = await prisma.station.create({
      data: createData,
    });
    res.status(201).json(station);
  } catch (err) {
    console.error('Error creating station:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update a station
r.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, lat, lng } = req.body || {};
    const updated = await prisma.station.update({
      where: { id: String(id) }, // Station ID luôn là String
      data: {
        ...(name !== undefined && { name: String(name) }),
        ...(address !== undefined && { address: String(address) }),
        ...(lat !== undefined && { lat: Number(lat) }),
        ...(lng !== undefined && { lng: Number(lng) }),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a station
r.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stationId = String(id); // Station ID luôn là String

    // Check if station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        vehicles: true,
        bookings: true
      }
    });

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check for associated vehicles
    if (station.vehicles.length > 0) {
      return res.status(400).json({ error: 'Cannot delete station with associated vehicles. Please remove all vehicles first.' });
    }

    // Check for associated bookings
    if (station.bookings.length > 0) {
      return res.status(400).json({ error: 'Cannot delete station with associated bookings.' });
    }

    await prisma.station.delete({ where: { id: stationId } });
    res.json({ success: true, message: 'Station deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = r;
