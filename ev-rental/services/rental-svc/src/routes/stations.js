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
    const station = await prisma.station.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = r;
