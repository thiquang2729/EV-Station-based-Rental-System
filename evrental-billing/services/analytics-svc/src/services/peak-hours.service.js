import * as stationRepo from '../repositories/station-stats.repo.js';

export async function getPeakHours(stationId, from, to) {
  const peakHours = await stationRepo.getPeakHoursByStation(stationId, from, to);
  
  return {
    success: true,
    data: {
      stationId,
      period: { from, to },
      peakHours: peakHours || []
    }
  };
}
