const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const stations = require('./routes/stations');
const vehicles = require('./routes/vehicles');
const bookings = require('./routes/bookings');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Middleware để extract user info từ headers (forwarded by APISIX)
// Áp dụng cho tất cả routes
app.use(requireAuth());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/stations', stations);
app.use('/api/v1/vehicles', vehicles);
app.use('/api/v1/bookings', bookings);

module.exports = app;
