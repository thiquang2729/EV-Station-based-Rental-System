import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import prom from 'prom-client';

const dotenvResult = dotenv.config();
if (dotenvResult.parsed) {
  for (const [key, value] of Object.entries(dotenvResult.parsed)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

import paymentsRoutes from './routes/payments.routes.js';
import posRoutes from './routes/pos.routes.js';
import depositsRoutes from './routes/deposits.routes.js';
import webhooksRoutes from './routes/webhooks.routes.js';
import publicRoutes from './routes/public.routes.js';

import errorMiddleware from './middlewares/error.js';
import logger from './utils/logger.js';

prom.collectDefaultMetrics();

const app = express();
app.set('trust proxy', true);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'payment-svc', time: new Date().toISOString() });
});
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prom.register.contentType);
  res.end(await prom.register.metrics());
});

app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/deposits', depositsRoutes);
app.use('/api/v1/webhooks/vnpay', webhooksRoutes);
app.use('/api/v1/public', publicRoutes);

app.use(errorMiddleware);

export default app;
