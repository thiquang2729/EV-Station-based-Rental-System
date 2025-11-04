import prisma from '../dao/prisma.js';

const buildCompositeKey = (key, scope) => `${scope}:${key}`;

export async function ensure(key, scope){
  const compositeKey = buildCompositeKey(key, scope);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.idempotencyKey.findUnique({
      where: { key: compositeKey }
    });
    
    if(existing){
      if(existing.status === 'SUCCEEDED'){
        const e = new Error('IDEMPOTENT_KEY_ALREADY_SUCCEEDED');
        e.status = 409;
        throw e;
      }
      if(existing.status === 'FAILED'){
        await tx.idempotencyKey.update({
          where: { key: compositeKey },
          data: { status: 'PENDING' }
        });
      }
    } else {
      await tx.idempotencyKey.create({
        data: { key: compositeKey, scope, status: 'PENDING' }
      });
    }
  });
}

export async function markSucceeded(key, scope){
  const compositeKey = buildCompositeKey(key, scope);
  return prisma.idempotencyKey.update({
    where: { key: compositeKey },
    data: { status: 'SUCCEEDED' }
  });
}

export async function markFailed(key, scope, reason){
  const compositeKey = buildCompositeKey(key, scope);
  const updateData = { status: 'FAILED' };
  if (reason) {
    updateData.response = { message: reason };
  }
  return prisma.idempotencyKey.update({
    where: { key: compositeKey },
    data: updateData
  });
}
