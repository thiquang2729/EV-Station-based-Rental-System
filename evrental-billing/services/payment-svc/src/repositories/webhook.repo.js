import prisma from '../dao/prisma.js';
export async function log(provider, rawQuery, verified){
  return prisma.webhookInbound.create({ data: { provider, rawQuery, verified } });
}
