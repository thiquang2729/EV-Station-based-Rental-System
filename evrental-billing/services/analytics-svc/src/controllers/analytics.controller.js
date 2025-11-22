import * as aggregatesService from '../services/aggregates.service.js';
import * as utilizationService from '../services/utilization.service.js';
import * as peakHoursService from '../services/peak-hours.service.js';
import * as forecastService from '../services/forecast.service.js';
import * as userStatsRepo from '../repositories/user-stats.repo.js';
import * as revenueRepo from '../repositories/revenue.repo.js';
import * as whitehouseRepo from '../repositories/whitehouse.repo.js';

export async function getRevenue(req, res, next) {
  try {
    const { stationId, from, to, granularity } = req.query;
    // Use whitehouse for revenue data
    const result = await whitehouseRepo.getRevenueFromWhitehouse(stationId, from, to, granularity || 'day');
    res.json(result);
  } catch (err) { next(err); }
}

export async function getUtilization(req, res, next) {
  try {
    const { stationId, from, to } = req.query;
    // Use whitehouse for utilization data
    const stats = await whitehouseRepo.getUtilizationFromWhitehouse(stationId, from, to);
    
    // Frontend expects array format: [{ name: string, value: number }]
    // Format: [{ name: 'In Use', value: percentage }, { name: 'Available', value: 100 - percentage }]
    const utilizationPercentage = stats.utilization || 0;
    const availablePercentage = Math.max(0, 100 - utilizationPercentage);
    
    res.json({
      success: true,
      data: [
        { name: 'In Use', value: Math.round(utilizationPercentage * 100) / 100 },
        { name: 'Available', value: Math.round(availablePercentage * 100) / 100 }
      ]
    });
  } catch (err) { next(err); }
}

export async function getRevenueDaily(req, res, next) {
  try {
    const { from, to } = req.query;
    // Use whitehouse for revenue daily data
    const result = await whitehouseRepo.getRevenueFromWhitehouse(null, from, to, 'day');
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getPeakHours(req, res, next) {
  try {
    const { stationId, from, to } = req.query;
    const result = await peakHoursService.getPeakHours(stationId, from, to);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getUserOverview(req, res, next) {
  try {
    const { renterId } = req.params;
    const data = await userStatsRepo.getUserOverview(renterId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getDemandForecast(req, res, next) {
  try {
    const { stationId, horizonDays } = req.query;
    const result = await forecastService.getDemandForecast(stationId, Number(horizonDays));
    res.json(result);
  } catch (err) { next(err); }
}