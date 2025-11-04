import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import prom from 'prom-client';
import errorMiddleware from './middlewares/error.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import { registerNightlyAggregateJob } from './jobs/nightly-aggregate.job.js';

prom.collectDefaultMetrics();

const app = express();
app.set('trust proxy', true);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req,res)=>{
  res.json({ status:'ok', service:'analytics-svc', time: new Date().toISOString() });
});
app.get('/metrics', async (req,res)=>{
  res.set('Content-Type', prom.register.contentType);
  res.end(await prom.register.metrics());
});

app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);

app.use(errorMiddleware);

export default app;

// Register cron after app creation
registerNightlyAggregateJob();
