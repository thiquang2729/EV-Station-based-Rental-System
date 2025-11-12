const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const stations = require('./routes/stations');
const vehicles = require('./routes/vehicles');
const bookings = require('./routes/bookings');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/stations', stations);
app.use('/api/v1/vehicles', vehicles);
app.use('/api/v1/bookings', bookings);

module.exports = app;
