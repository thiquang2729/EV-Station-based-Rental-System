import * as stationRepo from '../repositories/station-stats.repo.js';
import * as utilizationService from '../services/utilization.service.js';
import * as peakHoursService from '../services/peak-hours.service.js';
import { generateCSV, setCSVHeaders } from '../utils/csv.js';

export async function getStationsReport(req, res, next) {
  try {
    const { date, format } = req.query;
    
    // Get all stations (in real implementation, this would come from rental service)
    const stations = ['S1', 'S2', 'S3']; // Mock data
    
    const reportData = [];
    
    for (const stationId of stations) {
      // Get revenue for the date
      const revenueData = await stationRepo.getRevenueByStation(
        stationId, 
        date, 
        date, 
        'day'
      );
      
      // Get utilization
      const utilizationData = await utilizationService.getUtilization(
        stationId, 
        date, 
        date
      );
      
      // Get peak hours
      const peakHoursData = await peakHoursService.getPeakHours(
        stationId, 
        date, 
        date
      );
      
      const revenue = revenueData.length > 0 ? revenueData[0].revenue : 0;
      const rentalsCount = revenueData.length > 0 ? revenueData[0].transactionCount : 0;
      const utilization = utilizationData.data.utilization.percentage;
      const peakHour = peakHoursData.data.peakHours.length > 0 ? peakHoursData.data.peakHours[0] : null;
      
      reportData.push({
        stationId,
        date,
        rentalsCount,
        revenue,
        utilization,
        peakHour
      });
    }
    
    if (format === 'csv') {
      const headers = ['stationId', 'date', 'rentalsCount', 'revenue', 'utilization', 'peakHour'];
      const csv = generateCSV(reportData, headers);
      setCSVHeaders(res, `stations-report-${date}.csv`);
      return res.send(csv);
    }
    
    res.json({ success: true, data: reportData });
  } catch (err) { next(err); }
}
