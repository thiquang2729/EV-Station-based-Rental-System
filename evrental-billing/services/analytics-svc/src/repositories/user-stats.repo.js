import prisma from '../dao/prisma.js';

export async function getUserOverview(renterId) {
  const result = await prisma.$queryRaw`
    SELECT 
      renterId,
      COUNT(DISTINCT bookingId) as totalRentals,
      SUM(amount) as totalSpent,
      AVG(amount) as averageSpent,
      COUNT(DISTINCT stationId) as stationsUsed,
      HOUR(createdAt) as preferredHour
    FROM Payment 
    WHERE renterId = ${renterId}
      AND status = 'SUCCEEDED'
    GROUP BY renterId, HOUR(createdAt)
    ORDER BY COUNT(*) DESC
    LIMIT 1
  `;

  const stats = result[0] || {
    renterId,
    totalRentals: 0,
    totalSpent: 0,
    averageSpent: 0,
    stationsUsed: 0,
    preferredHour: null
  };

  // Get recent activity
  const recentActivity = await prisma.payment.findMany({
    where: {
      renterId,
      status: 'SUCCEEDED'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      amount: true,
      type: true,
      stationId: true,
      createdAt: true
    }
  });

  return {
    ...stats,
    recentActivity
  };
}
