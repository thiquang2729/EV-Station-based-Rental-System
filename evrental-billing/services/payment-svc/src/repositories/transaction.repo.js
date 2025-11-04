import prisma from '../dao/prisma.js';
export async function log(paymentId, fromStatus, toStatus, amount, actorId, meta){
  return prisma.paymentTransaction.create({ data: { paymentId, fromStatus, toStatus, amount, actorId, meta } });
}
