import { z } from 'zod';
import * as repo from '../repositories/payment.repo.js';
import * as vnp from './vnpay.service.js';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';

const intentSchema = z.object({
  bookingId: z.string().min(1),
  renterId: z.string().min(1).optional(),
  stationId: z.string().min(1).optional(),
  amount: z.number().int().positive(),
  method: z.nativeEnum(PaymentMethod),
  type: z.nativeEnum(PaymentType),
  description: z.string().max(255).optional(),
  // bankCode: z.string().trim().min(1).optional(),
  locale: z.string().trim().min(2).max(5).optional(),
  orderType: z.string().trim().max(32).optional()
});

export async function createIntent(dto, ipAddr = '127.0.0.1'){
  const input = intentSchema.parse(dto);
  const data = { ...input };
  if (typeof input.description === 'string') {
    const trimmed = input.description.trim();
    if (trimmed) {
      data.description = trimmed;
    } else {
      delete data.description;
    }
  }
  if(input.method === PaymentMethod.VNPAY){
    data.vnpTxnRef = vnp.newTxnRef();
    // data.vnpBankCode = input.bankCode || process.env.VNPAY_DEFAULT_BANK_CODE || 'VNBANK';
    data.vnpOrderInfo = data.description || null;
  }
  const payment = await repo.createPayment(data);
  if(input.method === PaymentMethod.VNPAY){
    try {
      const locale = (input.locale || process.env.VNPAY_DEFAULT_LOCALE || 'vn').toLowerCase();
      const orderType = input.orderType ? input.orderType.toLowerCase() : undefined;
      const orderInfo = payment.vnpOrderInfo || payment.description || `EVR Payment ${payment.id}`;
      const redirectUrl = await vnp.buildRedirect(payment, ipAddr, { 
        // bankCode: data.vnpBankCode, 
        locale, 
        orderType, 
        orderInfo 
      });
      return { success:true, data: { paymentId: payment.id, status: payment.status, redirectUrl } };
    } catch (error) {
      console.error('VNPAY buildRedirect failed:', error);
      // Fallback: return payment without redirectUrl
      return { success:true, data: { paymentId: payment.id, status: payment.status, error: error.message } };
    }
  }
  return { success:true, data: { paymentId: payment.id, status: payment.status } };
}

export async function getById(id){
  const data = await repo.getPaymentById(id);
  if(!data){ const e = new Error('NOT_FOUND'); e.status = 404; throw e; }
  return { success:true, data };
}

export async function list(query){
  const schema = z.object({
    bookingId: z.string().optional(), renterId: z.string().optional(), stationId: z.string().optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    from: z.string().optional(), to: z.string().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    offset: z.coerce.number().int().min(0).optional()
  });
  const input = schema.parse(query);
  const data = await repo.listPayments(input);
  return { success:true, data };
}

export async function cancel(id){
  const current = await repo.getPaymentById(id);
  if(!current){ const e = new Error('NOT_FOUND'); e.status = 404; throw e; }
  if(current.status !== PaymentStatus.PENDING){ const e = new Error('INVALID_STATE'); e.status=409; throw e; }
  const updated = await repo.updateStatus(id, PaymentStatus.CANCELED);
  await repo.createTransaction({ 
    paymentId: id, 
    fromStatus: current.status,
    toStatus: PaymentStatus.CANCELED,
    amount: current.amount,
    actorId: null,
    meta: { kind: 'CANCELED', message: 'User canceled payment' }
  });
  return { success:true, data: updated };
}

export async function refund(id, body){
  const schema = z.object({ amount: z.number().int().positive().optional() });
  const input = schema.parse(body || {});
  const current = await repo.getPaymentById(id);
  if(!current){ const e = new Error('NOT_FOUND'); e.status = 404; throw e; }
  if(current.status !== PaymentStatus.SUCCEEDED){ const e = new Error('INVALID_STATE'); e.status=409; throw e; }
  const updated = await repo.updateStatus(id, PaymentStatus.REFUNDED);
  await repo.createTransaction({ 
    paymentId: id, 
    fromStatus: current.status,
    toStatus: PaymentStatus.REFUNDED,
    amount: input.amount || current.amount,
    actorId: null,
    meta: { kind: 'REFUND', message: input.amount ? `Partial refund ${input.amount}` : 'Full refund' }
  });
  return { success:true, data: updated };
}
