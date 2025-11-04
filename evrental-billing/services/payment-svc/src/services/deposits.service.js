import { z } from 'zod';
import * as drepo from '../repositories/deposit.repo.js';
import * as prepo from '../repositories/payment.repo.js';
import { PaymentMethod, PaymentType, PaymentStatus, DepositStatus } from '../utils/enums.js';

const holdSchema = z.object({
  bookingId: z.string().min(1),
  renterId: z.string().min(1).optional(),
  stationId: z.string().min(1).optional(),
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod)
});

const releaseSchema = z.object({
  amountRelease: z.number().positive()
});

const forfeitSchema = z.object({
  amount: z.number().positive()
});

export async function hold(dto, user){
  const input = holdSchema.parse(dto);
  
  // RBAC check
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(input.stationId && !userStationIds.includes(input.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }
  
  const depositData = {
    bookingId: input.bookingId,
    renterId: input.renterId,
    stationId: input.stationId,
    amount: input.amount
  };
  
  const deposit = await drepo.createDeposit(depositData);
  
  // Create corresponding payment
  const paymentData = {
    bookingId: input.bookingId,
    renterId: input.renterId,
    stationId: input.stationId,
    amount: input.amount,
    method: input.method,
    type: PaymentType.DEPOSIT,
    status: input.method === PaymentMethod.VNPAY ? PaymentStatus.PENDING : PaymentStatus.SUCCEEDED,
    createdBy: user.id
  };
  
  const payment = await prepo.createPayment(paymentData);
  
  // Update deposit with payment reference
  await drepo.updateDepositStatus(deposit.id, DepositStatus.HELD, { holdPaymentId: payment.id });
  
  // Log transaction
  await prepo.createTransaction({
    paymentId: payment.id,
    fromStatus: null,
    toStatus: payment.status,
    amount: payment.amount,
    actorId: user.id,
    meta: { kind: 'DEPOSIT_HELD', message: `Deposit held via ${input.method}`, raw: null }
  });
  
  return { success: true, data: { deposit, payment } };
}

export async function release(id, dto, user){
  const input = releaseSchema.parse(dto);
  
  const deposit = await drepo.getDepositById(id);
  if(!deposit) {
    const e = new Error('NOT_FOUND'); e.status = 404; throw e;
  }
  
  // RBAC check
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(!userStationIds.includes(deposit.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }
  
  if(input.amountRelease > deposit.amount){
    const e = new Error('INVALID_AMOUNT'); e.status = 400; throw e;
  }
  
  const nextStatus = input.amountRelease === deposit.amount ? DepositStatus.RELEASED : DepositStatus.PARTIAL_FORFEIT;
  const updatedDeposit = await drepo.updateDepositStatus(id, nextStatus);
  
  // Create refund payment
  const refundPayment = await prepo.createPayment({
    bookingId: deposit.bookingId,
    renterId: deposit.renterId,
    stationId: deposit.stationId,
    amount: -input.amountRelease, // Negative for refund
    method: 'REFUND',
    type: PaymentType.DEPOSIT,
    status: PaymentStatus.SUCCEEDED,
    createdBy: user.id
  });
  
  await prepo.createTransaction({
    paymentId: refundPayment.id,
    fromStatus: null,
    toStatus: PaymentStatus.SUCCEEDED,
    amount: refundPayment.amount,
    actorId: user.id,
    meta: { kind: 'DEPOSIT_RELEASED', message: `Deposit released: ${input.amountRelease}`, raw: null }
  });
  
  return { success: true, data: { deposit: updatedDeposit, refundPayment } };
}

export async function forfeit(id, dto, user){
  const input = forfeitSchema.parse(dto);
  
  const deposit = await drepo.getDepositById(id);
  if(!deposit) {
    const e = new Error('NOT_FOUND'); e.status = 404; throw e;
  }
  
  // RBAC check
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(!userStationIds.includes(deposit.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }
  
  if(input.amount > deposit.amount){
    const e = new Error('INVALID_AMOUNT'); e.status = 400; throw e;
  }
  
  const nextStatus = input.amount === deposit.amount ? DepositStatus.FORFEIT : DepositStatus.PARTIAL_FORFEIT;
  const updatedDeposit = await drepo.updateDepositStatus(id, nextStatus);
  
  // Create fine payment
  const finePayment = await prepo.createPayment({
    bookingId: deposit.bookingId,
    renterId: deposit.renterId,
    stationId: deposit.stationId,
    amount: input.amount,
    method: 'FINE',
    type: PaymentType.FINE,
    status: PaymentStatus.SUCCEEDED,
    createdBy: user.id
  });
  
  await prepo.createTransaction({
    paymentId: finePayment.id,
    fromStatus: null,
    toStatus: PaymentStatus.SUCCEEDED,
    amount: finePayment.amount,
    actorId: user.id,
    meta: { kind: 'DEPOSIT_FORFEIT', message: `Deposit forfeit: ${input.amount}`, raw: null }
  });
  
  return { success: true, data: { deposit: updatedDeposit, finePayment } };
}
