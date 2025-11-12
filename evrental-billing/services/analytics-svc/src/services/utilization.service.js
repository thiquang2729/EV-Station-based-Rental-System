import * as stationRepo from '../repositories/station-stats.repo.js';
import * as rentalClient from './rental.client.js';

export async function getUtilization(stationId, from, to) {
  const stats = await stationRepo.getUtilizationByStation(stationId, from, to);
  
  // Get station capacity from rental service
  const capacity = await rentalClient.getStationCapacity(stationId);
  const totalCapacity = capacity.capacity || 1;
  
  const utilizationPercentage = stats.totalAvailableHours > 0 
    ? (stats.totalRentalHours / stats.totalAvailableHours) * 100 
    : 0;
  
  return {
    success: true,
    data: {
      stationId,
      period: { from, to },
      utilization: {
        percentage: Math.round(utilizationPercentage * 100) / 100,
        totalRentalHours: stats.totalRentalHours,
        totalAvailableHours: stats.totalAvailableHours,
        totalRentals: stats.totalRentals,
        capacity: totalCapacity
      }
    }
  };
}
