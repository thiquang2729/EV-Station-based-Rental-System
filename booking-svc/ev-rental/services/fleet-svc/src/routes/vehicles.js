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

    // Guard against duplicate id/plate to avoid primary/unique constraint errors
    if (id) {
      const existed = await prisma.vehicle.findUnique({ where: { id: String(id) } });
      if (existed) {
        return res.status(409).json({ success: false, message: 'Vehicle id already exists' });
      }
    }
    const plateExists = await prisma.vehicle.findUnique({ where: { plate: String(plate) } });
    if (plateExists) {
      return res.status(409).json({ success: false, message: 'Vehicle plate already exists' });
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
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Vehicle id or plate already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});
// Delete vehicle by id or plate
r.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // Try by primary id first
    let vehicle = await prisma.vehicle.findUnique({ where: { id: String(key) } });

    // If not found, try by unique plate
    if (!vehicle) {
      try {
        vehicle = await prisma.vehicle.findUnique({ where: { plate: String(key) } });
      } catch (_) {
        // ignore and fall through
      }
    }

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Block delete only if vehicle has an active booking (e.g., CONFIRMED/ongoing)
    const activeBooking = await prisma.$queryRaw`
      SELECT id, status FROM Booking
      WHERE vehicleId = ${vehicle.id} AND status NOT IN ('PENDING','RETURNED','CANCELLED')
      LIMIT 1
    `;
    if (Array.isArray(activeBooking) && activeBooking.length) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle while it has active bookings'
      });
    }

    // Cleanup related records (pending/history) then delete vehicle
    await prisma.$transaction([
      prisma.incident.deleteMany({ where: { vehicleId: vehicle.id } }),
      prisma.$executeRaw`DELETE FROM Booking WHERE vehicleId = ${vehicle.id}`,
      prisma.vehicle.delete({ where: { id: vehicle.id } })
    ]);

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    // Prisma foreign key constraint violation (e.g., bookings/incidents reference this vehicle)
    if (err?.code === 'P2003') {
      return res.status(400).json({ success: false, message: 'Cannot delete vehicle due to existing references. Remove related records first.' });
    }
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
module.exports = r;
