import cron from 'node-cron';
import prisma from '../dao/prisma.js';
import logger from '../utils/logger.js';

function getDateRangeForYesterday() {
  const now = new Date();
  // Chuyển sang Asia/Ho_Chi_Minh bằng cách cộng trừ offset nếu cần (đơn giản dùng local TZ của container)
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  return { start, end, dateStr: start.toISOString().split('T')[0] };
}

async function aggregateForDate(start, end, dateStr) {
  // Doanh thu và số giao dịch theo trạm
  const stationAgg = await prisma.$queryRaw`
    SELECT stationId, SUM(amount) as revenue, COUNT(*) as transactionCount
    FROM Payment
    WHERE status = 'SUCCEEDED' AND createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY stationId
  `;

  let stationUpserts = 0;
  for (const row of stationAgg) {
    await prisma.stationStatsDaily.upsert({
      where: { stationId_date: { stationId: row.stationId, date: dateStr } },
      update: {
        revenue: Number(row.revenue) || 0,
        transactions: Number(row.transactionCount) || 0
      },
      create: {
        stationId: row.stationId,
        date: dateStr,
        revenue: Number(row.revenue) || 0,
        transactions: Number(row.transactionCount) || 0
      }
    });
    stationUpserts++;
  }

  // Heatmap theo giờ
  const heatmap = await prisma.$queryRaw`
    SELECT stationId, HOUR(createdAt) as hour, COUNT(*) as cnt
    FROM Payment
    WHERE status = 'SUCCEEDED' AND createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY stationId, HOUR(createdAt)
  `;

  let heatmapUpserts = 0;
  for (const row of heatmap) {
    await prisma.hourlyHeatmap.upsert({
      where: { stationId_date_hour: { stationId: row.stationId, date: dateStr, hour: row.hour } },
      update: { count: Number(row.cnt) || 0 },
      create: { stationId: row.stationId, date: dateStr, hour: row.hour, count: Number(row.cnt) || 0 }
    });
    heatmapUpserts++;
  }

  // Thống kê user renter
  const userAgg = await prisma.$queryRaw`
    SELECT renterId, COUNT(DISTINCT bookingId) as rentals, SUM(amount) as spent
    FROM Payment
    WHERE status = 'SUCCEEDED' AND createdAt >= ${start} AND createdAt <= ${end}
    GROUP BY renterId
  `;

  let userUpserts = 0;
  for (const row of userAgg) {
    if (!row.renterId) continue;
    await prisma.userRentalStats.upsert({
      where: { renterId_date: { renterId: row.renterId, date: dateStr } },
      update: { rentals: Number(row.rentals) || 0, spent: Number(row.spent) || 0 },
      create: { renterId: row.renterId, date: dateStr, rentals: Number(row.rentals) || 0, spent: Number(row.spent) || 0 }
    });
    userUpserts++;
  }

  return { stationUpserts, heatmapUpserts, userUpserts };
}

export function registerNightlyAggregateJob() {
  if (String(process.env.ENABLE_CRON || 'false').toLowerCase() !== 'true') {
    logger.info('Nightly aggregate cron disabled (ENABLE_CRON!=true)');
    return;
  }

  // 01:00 hằng ngày theo TZ máy chạy (khuyến nghị đặt TZ=Asia/Ho_Chi_Minh trong env)
  cron.schedule('0 1 * * *', async () => {
    const { start, end, dateStr } = getDateRangeForYesterday();
    logger.info({ start, end, dateStr }, 'Nightly aggregate started');
    try {
      const result = await aggregateForDate(start, end, dateStr);
      logger.info({ ...result, dateStr }, 'Nightly aggregate finished');
    } catch (err) {
      logger.error({ err }, 'Nightly aggregate failed');
    }
  }, { timezone: process.env.TZ || 'Asia/Ho_Chi_Minh' });
}
