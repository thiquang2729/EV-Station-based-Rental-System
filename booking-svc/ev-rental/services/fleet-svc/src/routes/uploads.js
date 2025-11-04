const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { presignUpload } = require('../utils/s3');

const r = express.Router();

// POST /api/v1/uploads/presign
// body: { contentType, key?, prefix?, fileName? }
// returns: { uploadUrl, key, publicUrl, headers }
r.post('/presign', requireAuth(), async (req, res) => {
  try {
    const { contentType, key: rawKey, prefix = 'vehicles', fileName } = req.body || {};
    if (!contentType) {
      return res.status(400).json({ success: false, message: 'contentType is required' });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = (fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = rawKey || `${prefix}/${ts}-${safeName}`;

    // Validate required envs early for clearer error messages
    if (!process.env.S3_BUCKET && !process.env.AWS_S3_BUCKET_NAME) {
      return res.status(400).json({ success: false, message: 'S3_BUCKET (or AWS_S3_BUCKET_NAME) is not set on server' });
    }
    if (!process.env.S3_REGION && !process.env.AWS_REGION) {
      return res.status(400).json({ success: false, message: 'S3_REGION (or AWS_REGION) is not set on server' });
    }

    const { url } = await presignUpload(key, contentType);

    const region = process.env.S3_REGION || 'us-east-1';
    const bucket = process.env.S3_BUCKET || 'ev-station-documents';
    const publicBase = process.env.S3_PUBLIC_BASE || `https://${bucket}.s3.${region}.amazonaws.com`;
    const publicUrl = `${publicBase}/${key}`;

    res.json({
      success: true,
      message: 'OK',
      data: {
        uploadUrl: url,
        key,
        publicUrl,
        headers: { 'Content-Type': contentType },
      }
    });
  } catch (err) {
    console.error('presign error:', err);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

module.exports = r;
