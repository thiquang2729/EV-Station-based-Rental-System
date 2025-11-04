import prisma from '../dao/prisma.js';
import { PaymentStatus } from '../utils/enums.js';

const ALLOWED_TRANSITIONS = {
  [PaymentStatus.PENDING]: new Set([PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELED, PaymentStatus.REFUNDED]),
  [PaymentStatus.SUCCEEDED]: new Set([PaymentStatus.REFUNDED]),
  [PaymentStatus.FAILED]: new Set([]),
  [PaymentStatus.CANCELED]: new Set([]),
  [PaymentStatus.REFUNDED]: new Set([])
};

export async function createPayment(data){
  return prisma.$transaction(async (tx)=>{
    const payment = await tx.payment.create({ data: {
      bookingId: data.bookingId,
      renterId: data.renterId,
      stationId: data.stationId,
      type: data.type,
      method: data.method,
      amount: data.amount,
      description: data.description || null,
      status: data.status || PaymentStatus.PENDING,
      vnpTxnRef: data.vnpTxnRef || null,
      // vnpBankCode: data.vnpBankCode || null,
      vnpOrderInfo: data.vnpOrderInfo || data.description || null,
      createdBy: data.createdBy || null
    }});
    await tx.paymentTransaction.create({ data: {
      paymentId: payment.id,
      fromStatus: null,
      toStatus: data.status || PaymentStatus.PENDING,
      amount: data.amount,
      actorId: data.createdBy || null,
      meta: { kind: 'INTENT_CREATED', message: 'Payment intent created', raw: null }
    }});
    return payment;
  });
}

export async function getPaymentById(id){
  return prisma.payment.findUnique({ where: { id } });
}

export async function getPaymentByTxnRef(vnpTxnRef){
  if(!vnpTxnRef){
    return null;
  }
  return prisma.payment.findUnique({ where: { vnpTxnRef } });
}

export async function listPayments(filter){
  const where = {};
  if(filter.bookingId) where.bookingId = filter.bookingId;
  if(filter.renterId) where.renterId = filter.renterId;
  if(filter.stationId) where.stationId = filter.stationId;
  if(filter.status) where.status = filter.status;
  if(filter.from || filter.to){
    where.createdAt = {};
    if(filter.from) where.createdAt.gte = new Date(filter.from);
    if(filter.to) where.createdAt.lte = new Date(filter.to);
  }
  const take = Math.min(Number(filter.limit)||50, 200);
  const skip = Number(filter.offset)||0;
  return prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip });
}

export async function updateStatus(id, nextStatus, options = {}){
  const { extraData, transactionMeta } = options || {};
  return prisma.$transaction(async (tx)=>{
    const current = await tx.payment.findUnique({ where: { id } });
    if(!current) {
      const e = new Error('NOT_FOUND'); e.status = 404; throw e;
    }
    const allowed = ALLOWED_TRANSITIONS[current.status] || new Set();
    if(!allowed.has(nextStatus)){
      const e = new Error('INVALID_STATE'); e.status = 409; throw e;
    }
    const updatePayload = { status: nextStatus };
    if(extraData){
      for (const [key, value] of Object.entries(extraData)) {
        if (value !== undefined) {
          updatePayload[key] = value;
        }
      }
    }
    const updated = await tx.payment.update({ where: { id }, data: updatePayload });
    await tx.paymentTransaction.create({ data: {
      paymentId: id,
      fromStatus: current.status,
      toStatus: nextStatus,
      amount: current.amount,
      actorId: null,
      meta: transactionMeta || { kind: 'STATE_CHANGED', message: `${current.status} -> ${nextStatus}`, raw: null }
    }});
    return updated;
  });
}

export async function createTransaction({ paymentId, fromStatus, toStatus, amount, actorId, meta }){
  return prisma.paymentTransaction.create({ data: { paymentId, fromStatus, toStatus, amount, actorId, meta } });
}

export async function updateById(id, data){
  return prisma.payment.update({ where: { id }, data });
}
