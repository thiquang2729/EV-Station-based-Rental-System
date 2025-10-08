const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const vehicles = require('./routes/vehicles');
const incidents = require('./routes/incidents');
const overview = require('./routes/overview');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/vehicles', vehicles);
app.use('/api/v1/incidents', incidents);
app.use('/api/v1/overview', overview);

module.exports = app;
