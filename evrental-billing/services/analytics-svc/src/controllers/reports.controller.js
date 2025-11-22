import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';
import { generateCSV, setCSVHeaders } from '../utils/csv.js';

export async function getStationsReport(req, res, next) {
  // Set timeout để tránh request bị treo
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.warn('[getStationsReport] Request timeout, returning empty data');
      res.status(200).json({ success: true, data: [] });
    }
  }, 10000); // 10 seconds timeout

  try {
    const { date, format } = req.query;
    console.log('[getStationsReport] Request received:', { date, format, user: req.user?.id });
    
    const prisma = await Promise.race([
      getWhitehousePrisma(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Prisma client timeout')), 5000))
    ]).catch(err => {
      console.error('[getStationsReport] Failed to get Prisma client:', err.message);
      return null;
    });
    
    // Validate prisma client
    if (!prisma || typeof prisma.dimTime === 'undefined') {
      console.warn('[getStationsReport] Prisma client not properly initialized, returning empty data');
      clearTimeout(timeout);
      return res.json({ success: true, data: [] });
    }
    
    // Get time_id for the date với timeout
    const timeRecord = await Promise.race([
      prisma.dimTime.findUnique({
        where: {
          date: new Date(date),
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
    ]).catch(err => {
      console.error('[getStationsReport] Error querying dimTime:', err.message);
      return null;
    });

    if (!timeRecord) {
      console.log('[getStationsReport] No time record found for date:', date);
      clearTimeout(timeout);
      return res.json({ success: true, data: [] });
    }

    // Get aggregated stats for all stations on this date với timeout
    const stats = await Promise.race([
      prisma.aggDailyStats.findMany({
        where: {
          time_id: timeRecord.time_id,
        },
        include: {
          station: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
    ]).catch(err => {
      console.error('[getStationsReport] Error querying aggDailyStats:', err.message);
      return [];
    });

    // Get peak hours for each station với timeout
    const peakHoursData = await Promise.race([
      prisma.factPeakHours.findMany({
        where: {
          time_id: timeRecord.time_id,
        },
        orderBy: {
          peak_score: 'desc',
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
    ]).catch(err => {
      console.error('[getStationsReport] Error querying factPeakHours:', err.message);
      return [];
    });

    // Group peak hours by station
    const peakHoursByStation = {};
    peakHoursData.forEach((ph) => {
      const sid = ph.station_id || 'unknown';
      if (!peakHoursByStation[sid]) {
        peakHoursByStation[sid] = [];
      }
      peakHoursByStation[sid].push(ph.hour_of_day);
    });

    // Build report data
    const reportData = stats.map((stat) => ({
      stationId: stat.station_id,
      stationName: stat.station?.station_name || 'Unknown',
      date,
      rentalsCount: stat.total_bookings,
      revenue: Number(stat.total_revenue),
      utilization: stat.avg_booking_duration_hours ? Number(stat.avg_booking_duration_hours) : 0,
      peakHour: peakHoursByStation[stat.station_id]?.[0] || null,
    }));
    
    console.log('[getStationsReport] Returning data:', { count: reportData.length });
    
    clearTimeout(timeout);
    
    if (format === 'csv') {
      const headers = ['stationId', 'stationName', 'date', 'rentalsCount', 'revenue', 'utilization', 'peakHour'];
      const csv = generateCSV(reportData, headers);
      setCSVHeaders(res, `stations-report-${date}.csv`);
      return res.send(csv);
    }
    
    res.json({ success: true, data: reportData });
  } catch (err) { 
    clearTimeout(timeout);
    console.error('[getStationsReport] Unexpected error:', err);
    console.error('[getStationsReport] Error stack:', err.stack);
    // Return empty data instead of crashing
    if (!res.headersSent) {
      res.status(200).json({ success: true, data: [] });
    }
  }
}
