const express = require('express');
const prisma = require('../prisma');
const r = express.Router();

/**
 * 🚘 Lấy danh sách tất cả xe
 * GET /api/v1/vehicles
 */
r.get('/', async (_req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json({ success: true, message: 'OK', data: vehicles });
  } catch (err) {
    console.error('❌ Lỗi khi lấy danh sách xe:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * 🔍 Lấy chi tiết 1 xe theo ID
 * GET /api/v1/vehicles/:id
 */
r.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: isNaN(id) ? id : Number(id) }, // hỗ trợ cả string hoặc number ID
    });

    if (!vehicle)
      return res.status(404).json({ success: false, message: 'Vehicle not found' });

    res.json({ success: true, message: 'OK', data: vehicle });
  } catch (err) {
    console.error('❌ Lỗi khi lấy xe:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Update vehicle fields
 * PUT /api/v1/vehicles/:id
 */
r.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stationId, type, plate, pricePerHour, isAvailable, batteryLevel, healthStatus, imageUrl } = req.body || {};
    const updated = await prisma.vehicle.update({
      where: { id: isNaN(id) ? id : Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(stationId !== undefined && { stationId }),
        ...(type !== undefined && { type }),
        ...(plate !== undefined && { plate }),
        ...(pricePerHour !== undefined && { pricePerHour }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(batteryLevel !== undefined && { batteryLevel }),
        ...(healthStatus !== undefined && { healthStatus }),
        ...(imageUrl !== undefined && { imageUrl }),
      }
    });
    res.json({ success: true, message: 'Vehicle updated', data: updated });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * ⚙️ Cập nhật trạng thái hoặc thông tin xe
 * PUT /api/v1/vehicles/:id/status
 */
r.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isAvailable, batteryLevel, healthStatus } = req.body;

    const updated = await prisma.vehicle.update({
      where: { id: isNaN(id) ? id : Number(id) },
      data: {
        ...(status && { status }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(batteryLevel !== undefined && { batteryLevel }),
        ...(healthStatus && { healthStatus }),
      },
    });

    res.json({ success: true, message: 'Vehicle updated', data: updated });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật xe:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * ➕ Thêm xe mới
 * POST /api/v1/vehicles
 */
r.post('/', async (req, res) => {
  try {
    const { 
      id, 
      name, 
      stationId,  // ✅ thêm stationId
      plate, 
      type, 
      status, 
      isAvailable, 
      batteryLevel, 
      healthStatus,
      pricePerHour // ✅ thêm giá thuê
    } = req.body;
    const imageUrl = req.body.imageUrl;

    // ⚠️ Kiểm tra thông tin bắt buộc
    if (!id || !stationId || !type || !plate || !pricePerHour) {
      return res.status(400).json({ 
        success: false, 
        message: 'Thiếu thông tin bắt buộc (id, stationId, type, plate, pricePerHour)' 
      });
    }

    // 🟢 Tạo mới xe
    const vehicle = await prisma.vehicle.create({
      data: {
        id,
        name: name || "Chưa đặt tên",
        stationId,
        type,
        plate,
        
        isAvailable: isAvailable ?? true,
        batteryLevel: batteryLevel ?? 100,
        healthStatus: healthStatus || "GOOD",
        pricePerHour,
        imageUrl: imageUrl || null
      },
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (err) {
    console.error('❌ Lỗi khi thêm xe:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: err.message 
    });
  }
});

/**
 * Delete vehicle
 * DELETE /api/v1/vehicles/:id
 */
r.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id: isNaN(id) ? id : Number(id) } });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = r;
