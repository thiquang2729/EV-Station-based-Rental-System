import prisma from '../dao/prisma.js';
import { DepositStatus } from '../utils/enums.js';

const ALLOWED_TRANSITIONS = {
  [DepositStatus.HELD]: new Set([DepositStatus.RELEASED, DepositStatus.PARTIAL_FORFEIT, DepositStatus.FORFEIT, DepositStatus.CANCELED]),
  [DepositStatus.RELEASED]: new Set([]),
  [DepositStatus.PARTIAL_FORFEIT]: new Set([DepositStatus.RELEASED, DepositStatus.FORFEIT]),
  [DepositStatus.FORFEIT]: new Set([]),
  [DepositStatus.CANCELED]: new Set([])
};

export async function createDeposit(data){
  return prisma.deposit.create({ data: {
    bookingId: data.bookingId,
    renterId: data.renterId,
    stationId: data.stationId,
    amount: data.amount,
    status: DepositStatus.HELD,
    holdPaymentId: data.holdPaymentId || null,
    note: data.note || null
  }});
}

export async function getDepositById(id){
  return prisma.deposit.findUnique({ where: { id } });
}

export async function updateDepositStatus(id, nextStatus, patch = {}){
  return prisma.$transaction(async (tx) => {
    const current = await tx.deposit.findUnique({ where: { id } });
    if(!current) {
      const e = new Error('NOT_FOUND'); e.status = 404; throw e;
    }
    const allowed = ALLOWED_TRANSITIONS[current.status] || new Set();
    if(!allowed.has(nextStatus)){
      const e = new Error('INVALID_STATE'); e.status = 409; throw e;
    }
    return tx.deposit.update({ where: { id }, data: { status: nextStatus, ...patch } });
  });
}
