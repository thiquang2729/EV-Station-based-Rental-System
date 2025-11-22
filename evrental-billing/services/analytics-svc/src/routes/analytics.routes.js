import { Router } from 'express';
import * as ctrl from '../controllers/analytics.controller.js';
import auth from '../middlewares/auth.js';
import { requireRole, scopeStation, scopeUser } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';
import { Granularity } from '../utils/enums.js';

const r = Router();

// PUBLIC: Revenue daily (no auth)
const revenueDailyQuerySchema = {
  query: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).refine(data => new Date(data.from) <= new Date(data.to), {
    message: "from date must be <= to date",
    path: ["from"]
  })
};

r.get('/revenue-daily', validate(revenueDailyQuerySchema), ctrl.getRevenueDaily);

// Authenticated routes below
r.use(auth);

const analyticsQuerySchema = {
  query: z.object({
    stationId: z.string().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    granularity: z.nativeEnum(Granularity).default('day')
  }).refine(data => new Date(data.from) <= new Date(data.to), {
    message: "from date must be <= to date",
    path: ["from"]
  })
};

const forecastQuerySchema = {
  query: z.object({
    stationId: z.string().min(1),
    horizonDays: z.coerce.number().int().min(1).max(30).default(14)
  })
};

// Utilization query schema (only stationId, no date range needed for today)
const utilizationQuerySchema = {
  query: z.object({
    stationId: z.string().optional(),
  })
};

// Revenue analytics
r.get('/revenue', 
  requireRole('STAFF', 'ADMIN'), 
  scopeStation, 
  validate(analyticsQuerySchema), 
  ctrl.getRevenue
);

// NOTE: '/revenue-daily' defined above as public

// Utilization analytics (peak hours for today)
r.get('/utilization', 
  requireRole('STAFF', 'ADMIN'), 
  scopeStation, 
  validate(utilizationQuerySchema), 
  ctrl.getUtilization
);

// Peak hours analytics
r.get('/peak-hours', 
  requireRole('STAFF', 'ADMIN'), 
  scopeStation, 
  validate(analyticsQuerySchema), 
  ctrl.getPeakHours
);

// User overview (RENTER can only access their own)
r.get('/user/:renterId/overview', 
  requireRole('RENTER', 'STAFF', 'ADMIN'), 
  scopeUser, 
  ctrl.getUserOverview
);

// Demand forecast
r.get('/demand-forecast', 
  requireRole('STAFF', 'ADMIN'), 
  scopeStation, 
  validate(forecastQuerySchema), 
  ctrl.getDemandForecast
);

export default r;