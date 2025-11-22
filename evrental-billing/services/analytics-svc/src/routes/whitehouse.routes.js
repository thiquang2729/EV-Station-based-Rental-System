import { Router } from 'express';
import * as ctrl from '../controllers/whitehouse.controller.js';
import auth from '../middlewares/auth.js';
import { requireRole, scopeStation } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';

const r = Router();

// Apply auth middleware to all routes
r.use(auth);

const analyticsQuerySchema = {
  query: z.object({
    stationId: z.string().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
  }).refine(data => new Date(data.from) <= new Date(data.to), {
    message: "from date must be <= to date",
    path: ["from"]
  })
};

const dateQuerySchema = {
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
};

// Revenue analytics from whitehouse
r.get('/revenue',
  requireRole('STAFF', 'ADMIN'),
  scopeStation,
  validate(analyticsQuerySchema),
  ctrl.getRevenueFromWhitehouse
);

// Utilization analytics from whitehouse
r.get('/utilization',
  requireRole('STAFF', 'ADMIN'),
  scopeStation,
  validate(analyticsQuerySchema),
  ctrl.getUtilizationFromWhitehouse
);

// Peak hours analytics from whitehouse
r.get('/peak-hours',
  requireRole('STAFF', 'ADMIN'),
  scopeStation,
  validate(analyticsQuerySchema),
  ctrl.getPeakHoursFromWhitehouse
);

// Daily stats from whitehouse
r.get('/daily-stats',
  requireRole('STAFF', 'ADMIN'),
  scopeStation,
  validate(analyticsQuerySchema),
  ctrl.getDailyStatsFromWhitehouse
);

// Station report from whitehouse
r.get('/reports/stations',
  requireRole('STAFF', 'ADMIN'),
  validate(dateQuerySchema),
  ctrl.getStationReportFromWhitehouse
);

export default r;

