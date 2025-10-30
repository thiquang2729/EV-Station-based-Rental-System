import { Router } from 'express';
import * as ctrl from '../controllers/payments.controller.js';
import auth from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { z } from 'zod';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';

const r = Router();
r.use(auth);

const intentSchema = {
  body: z.object({
    bookingId: z.string().min(1),
    renterId: z.string().min(1).optional(),
    stationId: z.string().min(1).optional(),
    amount: z.number().int().positive(),
    method: z.nativeEnum(PaymentMethod),
    type: z.nativeEnum(PaymentType),
    description: z.string().max(255).optional()
  })
};

r.post('/intents', validate(intentSchema), ctrl.createIntent);
r.get('/:id', ctrl.getPaymentById);
r.post('/:id/cancel', ctrl.cancelPayment);

const refundSchema = { body: z.object({ amount: z.number().int().positive().optional() }) };
r.post('/:id/refund', validate(refundSchema), ctrl.refundPayment);

const listSchema = { query: z.object({
  bookingId: z.string().optional(), renterId: z.string().optional(), stationId: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  from: z.string().optional(), to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
}) };

r.get('/', validate(listSchema), ctrl.queryPayments);
export default r;
