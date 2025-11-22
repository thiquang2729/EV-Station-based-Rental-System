import * as whitehouseRepo from '../repositories/whitehouse.repo.js';

export async function getRevenueFromWhitehouse(req, res, next) {
  try {
    const { stationId, from, to, granularity = 'day' } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'from and to query parameters are required',
      });
    }

    const data = await whitehouseRepo.getRevenueFromWhitehouse(
      stationId,
      from,
      to,
      granularity
    );

    res.json({
      success: true,
      data,
      source: 'whitehouse',
    });
  } catch (err) {
    next(err);
  }
}

export async function getUtilizationFromWhitehouse(req, res, next) {
  try {
    const { stationId, from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'from and to query parameters are required',
      });
    }

    const data = await whitehouseRepo.getUtilizationFromWhitehouse(
      stationId,
      from,
      to
    );

    res.json({
      success: true,
      data: {
        utilization: {
          percentage: data.utilization,
          totalRentals: data.totalRentals,
          totalRentalHours: data.totalRentalHours,
          totalAvailableHours: data.totalAvailableHours,
        },
      },
      source: 'whitehouse',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPeakHoursFromWhitehouse(req, res, next) {
  try {
    const { stationId, from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'from and to query parameters are required',
      });
    }

    const data = await whitehouseRepo.getPeakHoursFromWhitehouse(
      stationId,
      from,
      to
    );

    res.json({
      success: true,
      data: {
        peakHours: data.map((d) => d.hour),
        details: data,
      },
      source: 'whitehouse',
    });
  } catch (err) {
    next(err);
  }
}

export async function getDailyStatsFromWhitehouse(req, res, next) {
  try {
    const { stationId, from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'from and to query parameters are required',
      });
    }

    const data = await whitehouseRepo.getDailyStatsFromWhitehouse(
      stationId,
      from,
      to
    );

    res.json({
      success: true,
      data,
      source: 'whitehouse',
    });
  } catch (err) {
    next(err);
  }
}

export async function getStationReportFromWhitehouse(req, res, next) {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'date query parameter is required (format: YYYY-MM-DD)',
      });
    }

    const data = await whitehouseRepo.getStationReportFromWhitehouse(date);

    res.json({
      success: true,
      data,
      source: 'whitehouse',
    });
  } catch (err) {
    next(err);
  }
}

