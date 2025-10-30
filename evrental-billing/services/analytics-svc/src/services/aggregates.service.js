import * as stationRepo from '../repositories/station-stats.repo.js';
import * as revenueRepo from '../repositories/revenue.repo.js';
import { Granularity } from '../utils/enums.js';

export async function getRevenueSeries(stationId, from, to, granularity) {
  if (!stationId && granularity === Granularity.day) {
    const rows = await revenueRepo.getRevenueDaily(from, to);
    return {
      success: true,
      data: {
        stationId: null,
        granularity,
        period: { from, to },
        series: rows.map(item => ({ period: item.date, revenue: Number(item.total), transactionCount: null }))
      }
    };
  }
  const data = await stationRepo.getRevenueByStation(stationId, from, to, granularity);
  
  return {
    success: true,
    data: {
      stationId,
      granularity,
      period: { from, to },
      series: data.map(item => ({
        period: item.period,
        revenue: Number(item.revenue),
        transactionCount: Number(item.transactionCount)
      }))
    }
  };
}