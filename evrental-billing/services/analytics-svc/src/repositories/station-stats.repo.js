import prisma from '../dao/prisma.js';

export async function getRevenueByStation(stationId, from, to, granularity) {
  const where = {
    stationId,
    status: 'SUCCEEDED',
    createdAt: {
      gte: new Date(from),
      lte: new Date(to)
    }
  };

  const groupBy = granularity === 'day' ? 'DATE(createdAt)' :
                  granularity === 'week' ? 'YEARWEEK(createdAt)' :
                  'YEAR(createdAt), MONTH(createdAt)';

  const result = await prisma.$queryRaw`
    SELECT 
      ${granularity === 'day' ? 'DATE(createdAt) as period' :
        granularity === 'week' ? 'YEARWEEK(createdAt) as period' :
        'CONCAT(YEAR(createdAt), "-", LPAD(MONTH(createdAt), 2, "0")) as period'},
      SUM(amount) as revenue,
      COUNT(*) as transactionCount
    FROM Payment 
    WHERE stationId = ${stationId}
      AND status = 'SUCCEEDED'
      AND createdAt >= ${new Date(from)}
      AND createdAt <= ${new Date(to)}
    GROUP BY ${granularity === 'day' ? 'DATE(createdAt)' :
               granularity === 'week' ? 'YEARWEEK(createdAt)' :
               'YEAR(createdAt), MONTH(createdAt)'}
    ORDER BY period
  `;

  return result;
}

export async function getUtilizationByStation(stationId, from, to) {
  // Mock data - in real implementation, this would query rental data
  const result = await prisma.$queryRaw`
    SELECT 
      stationId,
      COUNT(DISTINCT bookingId) as totalRentals,
      SUM(TIMESTAMPDIFF(HOUR, createdAt, updatedAt)) as totalRentalHours,
      ${24 * Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24))} as totalAvailableHours
    FROM Payment 
    WHERE stationId = ${stationId}
      AND status = 'SUCCEEDED'
      AND createdAt >= ${new Date(from)}
      AND createdAt <= ${new Date(to)}
    GROUP BY stationId
  `;

  return result[0] || { stationId, totalRentals: 0, totalRentalHours: 0, totalAvailableHours: 0 };
}

export async function getPeakHoursByStation(stationId, from, to) {
  const result = await prisma.$queryRaw`
    SELECT 
      HOUR(createdAt) as hour,
      COUNT(*) as transactionCount
    FROM Payment 
    WHERE stationId = ${stationId}
      AND status = 'SUCCEEDED'
      AND createdAt >= ${new Date(from)}
      AND createdAt <= ${new Date(to)}
    GROUP BY HOUR(createdAt)
    ORDER BY transactionCount DESC
    LIMIT 5
  `;

  return result.map(row => row.hour);
}
