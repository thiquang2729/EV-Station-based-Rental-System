import { Router } from 'express';
import * as ctrl from '../controllers/pos.controller.js';
import auth from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';
import { PaymentMethod, PaymentType } from '../utils/enums.js';

const r = Router();
r.use(auth);

const collectSchema = {
  body: z.object({
    bookingId: z.union([z.string(), z.number()]).transform(String),
    stationId: z.union([z.string(), z.number()]).transform(String),
    amount: z.number().positive(),
    method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD]),
    type: z.nativeEnum(PaymentType),
    description: z.string().optional()
  })
};

r.post('/collect', requireRole('STAFF', 'ADMIN'), validate(collectSchema), ctrl.collectPayment);
r.post('/:paymentId/confirm', requireRole('STAFF', 'ADMIN'), ctrl.confirmPayment);
export default r;
