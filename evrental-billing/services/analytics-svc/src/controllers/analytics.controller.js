import * as aggregatesService from '../services/aggregates.service.js';
import * as utilizationService from '../services/utilization.service.js';
import * as peakHoursService from '../services/peak-hours.service.js';
import * as forecastService from '../services/forecast.service.js';
import * as userStatsRepo from '../repositories/user-stats.repo.js';
import * as revenueRepo from '../repositories/revenue.repo.js';

export async function getRevenue(req, res, next) {
  try {
    const { stationId, from, to, granularity } = req.query;
    const result = await aggregatesService.getRevenueSeries(stationId, from, to, granularity);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getUtilization(req, res, next) {
  try {
    const { stationId, from, to } = req.query;
    const result = await utilizationService.getUtilization(stationId, from, to);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getRevenueDaily(req, res, next) {
  try {
    const { from, to } = req.query;
    const rows = await revenueRepo.getRevenueDaily(from, to);
    res.json({ success: true, data: rows });
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