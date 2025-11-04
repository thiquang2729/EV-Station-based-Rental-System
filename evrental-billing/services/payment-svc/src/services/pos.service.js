import { z } from 'zod';
import * as repo from '../repositories/payment.repo.js';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';

const collectSchema = z.object({
  bookingId: z.union([z.string(), z.number()]).transform(String),
  stationId: z.union([z.string(), z.number()]).transform(String),
  amount: z.number().positive(),
  method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD]),
  type: z.nativeEnum(PaymentType)
});

export async function collectAtPOS(dto, user){
  const input = collectSchema.parse(dto);
  
  // RBAC check
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(!userStationIds.includes(input.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }
  
  const paymentData = {
    bookingId: input.bookingId,
    stationId: input.stationId,
    amount: input.amount,
    method: input.method,
    type: input.type,
    status: PaymentStatus.SUCCEEDED,
    createdBy: user.id
  };
  
  const payment = await repo.createPayment(paymentData);
  await repo.createTransaction({
    paymentId: payment.id,
    fromStatus: null,
    toStatus: PaymentStatus.SUCCEEDED,
    amount: payment.amount,
    actorId: user.id,
    meta: { kind: 'POS_COLLECTED', message: `POS collection via ${input.method}`, raw: null }
  });
  
  return { success: true, data: payment };
}
