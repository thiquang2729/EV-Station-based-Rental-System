const express = require('express');
const prisma = require('../prisma');
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
      where: { id: isNaN(id) ? id : Number(id) },
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
    const { name, address, lat, lng } = req.body || {};
    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'name, lat, lng là bắt buộc' });
    }
    const station = await prisma.station.create({
      data: {
        name: String(name),
        address: address ? String(address) : '',
        lat: Number(lat),
        lng: Number(lng),
      },
    });
    res.status(201).json(station);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a station
r.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, lat, lng } = req.body || {};
    const updated = await prisma.station.update({
      where: { id: isNaN(id) ? id : Number(id) },
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
    await prisma.station.delete({ where: { id: isNaN(id) ? id : Number(id) } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = r;
