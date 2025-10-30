import { Router } from 'express';
import * as ctrl from '../controllers/deposits.controller.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';
import { PaymentMethod } from '../utils/enums.js';

const r = Router();
r.use(auth);

const holdSchema = {
  body: z.object({
    bookingId: z.string().min(1),
    renterId: z.string().min(1).optional(),
    stationId: z.string().min(1).optional(),
    amount: z.number().positive(),
    method: z.nativeEnum(PaymentMethod)
  })
};

const releaseSchema = {
  body: z.object({
    amountRelease: z.number().positive()
  })
};

const forfeitSchema = {
  body: z.object({
    amount: z.number().positive()
  })
};

r.post('/hold', requireRole('STAFF', 'ADMIN'), validate(holdSchema), ctrl.holdDeposit);
r.post('/:id/release', requireRole('STAFF', 'ADMIN'), validate(releaseSchema), ctrl.releaseDeposit);
r.post('/:id/forfeit', requireRole('STAFF', 'ADMIN'), validate(forfeitSchema), ctrl.forfeitDeposit);
export default r;
