const express = require('express');
const prisma = require('../prisma');

const r = express.Router();

// List all vehicles
r.get('/', async (_req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, message: 'OK', data: vehicles });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get vehicle by id
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({ where: { id: String(id) } });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'OK', data: vehicle });
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update availability/health/price
r.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable, batteryLevel, healthStatus, pricePerHour, name, imageUrl } = req.body || {};

    const updated = await prisma.vehicle.update({
      where: { id: String(id) },
      data: {
        ...(typeof isAvailable === 'boolean' ? { isAvailable } : {}),
        ...(typeof batteryLevel === 'number' ? { batteryLevel } : {}),
        ...(typeof pricePerHour === 'number' ? { pricePerHour } : {}),
        ...(healthStatus ? { healthStatus } : {}),
        ...(name ? { name } : {}),
        ...(typeof imageUrl !== 'undefined' ? { imageUrl } : {}),
      },
    });

    res.json({ success: true, message: 'Vehicle updated', data: updated });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new vehicle
r.post('/', async (req, res) => {
  try {
    const { id, name, stationId, plate, type, isAvailable, batteryLevel, healthStatus, pricePerHour, imageUrl } = req.body || {};

    if (!stationId || !type || !plate || typeof pricePerHour !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: stationId, type, plate, pricePerHour (number)'
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...(id ? { id: String(id) } : {}),
        name: name || 'Unknown',
        stationId: String(stationId),
        type: String(type),
        plate: String(plate),
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : 100,
        healthStatus: healthStatus || 'OK',
        pricePerHour: Number(pricePerHour),
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json({ success: true, message: 'Vehicle created successfully', data: vehicle });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

module.exports = r;