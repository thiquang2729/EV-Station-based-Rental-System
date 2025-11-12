import * as stationRepo from '../repositories/station-stats.repo.js';

export async function getDemandForecast(stationId, horizonDays = 14) {
  // Get historical data for the last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const historicalData = await stationRepo.getRevenueByStation(
    stationId, 
    startDate.toISOString().split('T')[0], 
    endDate.toISOString().split('T')[0], 
    'day'
  );
  
  // Simple moving average calculation
  const dailyRentals = historicalData.map(item => item.transactionCount);
  const movingAverage = dailyRentals.length > 0 
    ? dailyRentals.reduce((sum, val) => sum + val, 0) / dailyRentals.length 
    : 0;
  
  // Generate forecast for next N days
  const forecast = [];
  const today = new Date();
  
  for (let i = 1; i <= horizonDays; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    // Apply day-of-week seasonality (weekends typically higher)
    const dayOfWeek = forecastDate.getDay();
    const seasonalityFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
    
    const predictedRentals = Math.round(movingAverage * seasonalityFactor);
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predictedRentals,
      confidence: Math.max(0.5, 1 - (i * 0.05)) // Decreasing confidence over time
    });
  }
  
  return {
    success: true,
    data: {
      stationId,
      horizonDays,
      forecast,
      model: {
        type: 'moving_average_with_seasonality',
        movingAverage: Math.round(movingAverage * 100) / 100,
        historicalDays: dailyRentals.length
      }
    }
  };
}
