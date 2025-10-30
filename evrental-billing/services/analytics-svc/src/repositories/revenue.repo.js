import prisma from '../dao/prisma.js';

export async function getRevenueDaily(from, to){
  const rows = await prisma.$queryRaw`
    SELECT day, total FROM RevenueDaily
    WHERE day >= ${new Date(from)} AND day <= ${new Date(to)}
    ORDER BY day DESC`;
  return rows.map(r => ({ date: r.day, total: Number(r.total) }));
}


