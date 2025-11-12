import { Router } from 'express';
import * as ctrl from '../controllers/reports.controller.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';
import { ReportFormat } from '../utils/enums.js';

const r = Router();
r.use(auth);

const reportsQuerySchema = {
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    format: z.nativeEnum(ReportFormat).default('json')
  })
};

// Stations report
r.get('/stations', 
  requireRole('STAFF', 'ADMIN'), 
  validate(reportsQuerySchema), 
  ctrl.getStationsReport
);

export default r;
