import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

/**
 * Get revenue data from whitehouse fact_booking table
 */
export async function getRevenueFromWhitehouse(stationId, from, to, granularity = 'day') {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const prisma = await getWhitehousePrisma();

  // Query fact_booking (không cần join dim_time vì đã xóa foreign keys)
  const bookings = await prisma.factBooking.findMany({
    where: {
      start_time: {
        gte: fromDate,
        lte: toDate,
      },
      ...(stationId && { station_id: stationId }),
    },
    select: {
      start_time: true,
      price_estimate: true,
    },
    orderBy: {
      start_time: 'asc',
    },
  });

  // Group by granularity (tính từ start_time)
  const grouped = {};
  bookings.forEach((booking) => {
    const startTime = new Date(booking.start_time);
    let key;
    if (granularity === 'day') {
      key = startTime.toISOString().split('T')[0];
    } else if (granularity === 'week') {
      // Calculate week number
      const year = startTime.getFullYear();
      const oneJan = new Date(year, 0, 1);
      const week = Math.ceil((((startTime.getTime() - oneJan.getTime()) / 86400000) + oneJan.getDay() + 1) / 7);
      key = `${year}-W${String(week).padStart(2, '0')}`;
    } else if (granularity === 'month') {
      const year = startTime.getFullYear();
      const month = startTime.getMonth() + 1;
      key = `${year}-${String(month).padStart(2, '0')}`;
    } else {
      key = startTime.toISOString().split('T')[0];
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        revenue: 0,
        transactionCount: 0,
      };
    }

    grouped[key].revenue += Number(booking.price_estimate) || 0;
    grouped[key].transactionCount += 1;
  });

  return Object.values(grouped);
}

/**
 * Get utilization data from whitehouse fact_booking table
 */
export async function getUtilizationFromWhitehouse(stationId, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const prisma = await getWhitehousePrisma();

  const bookings = await prisma.factBooking.findMany({
    where: {
      status: 'CONFIRMED',
      start_time: {
        gte: fromDate,
        lte: toDate,
      },
      ...(stationId && { station_id: stationId }),
    },
    include: {
      station: true,
      vehicle: true,
    },
  });

  const totalRentals = bookings.length;
  const totalRentalHours = bookings.reduce((sum, b) => {
    return sum + (Number(b.duration_hours) || 0);
  }, 0);

  const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
  const totalAvailableHours = daysDiff * 24;

  const utilization = totalAvailableHours > 0 
    ? (totalRentalHours / totalAvailableHours) * 100 
    : 0;

  return {
    stationId: stationId || 'all',
    totalRentals,
    totalRentalHours,
    totalAvailableHours,
    utilization: Math.min(100, Math.max(0, utilization)),
  };
}

/**
 * Get peak hours data from whitehouse fact_peak_hours table
 */
export async function getPeakHoursFromWhitehouse(stationId, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const prisma = await getWhitehousePrisma();

  // Get time_ids for the date range
  const timeRecords = await prisma.dimTime.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      time_id: true,
    },
  });

  const timeIds = timeRecords.map((t) => t.time_id);

  const peakHours = await prisma.factPeakHours.findMany({
    where: {
      time_id: {
        in: timeIds,
      },
      ...(stationId && { station_id: stationId }),
    },
    include: {
      station: true,
    },
    orderBy: {
      peak_score: 'desc',
    },
    take: 10,
  });

  // Group by hour_of_day
  const grouped = {};
  peakHours.forEach((ph) => {
    const hour = ph.hour_of_day;
    if (!grouped[hour]) {
      grouped[hour] = {
        hour,
        totalBookings: 0,
        totalRevenue: 0,
        avgDurationHours: 0,
        peakScore: 0,
        count: 0,
      };
    }

    grouped[hour].totalBookings += ph.total_bookings;
    grouped[hour].totalRevenue += Number(ph.total_revenue);
    grouped[hour].peakScore += Number(ph.peak_score);
    grouped[hour].count += 1;
  });

  // Calculate averages
  Object.keys(grouped).forEach((hour) => {
    const g = grouped[hour];
    g.avgDurationHours = g.totalBookings > 0 ? g.totalRevenue / g.totalBookings : 0;
    g.peakScore = g.count > 0 ? g.peakScore / g.count : 0;
  });

  return Object.values(grouped).sort((a, b) => b.peakScore - a.peakScore);
}

/**
 * Get daily stats from whitehouse agg_daily_stats table
 */
export async function getDailyStatsFromWhitehouse(stationId, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const prisma = await getWhitehousePrisma();

  // Get time_ids for the date range
  const timeRecords = await prisma.dimTime.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      agg_daily_stats: {
        where: {
          ...(stationId && { station_id: stationId }),
        },
        include: {
          station: true,
        },
      },
    },
  });

  const stats = [];
  timeRecords.forEach((time) => {
    time.agg_daily_stats.forEach((stat) => {
      stats.push({
        date: time.date.toISOString().split('T')[0],
        stationId: stat.station_id,
        stationName: stat.station?.station_name || 'Unknown',
        totalBookings: stat.total_bookings,
        totalRevenue: Number(stat.total_revenue),
        totalPayments: stat.total_payments,
        completedBookings: stat.completed_bookings,
        cancelledBookings: stat.cancelled_bookings,
        avgBookingDurationHours: stat.avg_booking_duration_hours 
          ? Number(stat.avg_booking_duration_hours) 
          : null,
        uniqueUsers: stat.unique_users,
        uniqueVehicles: stat.unique_vehicles,
      });
    });
  });

  return stats;
}

/**
 * Get station report from whitehouse
 */
export async function getStationReportFromWhitehouse(date) {
  const dateObj = new Date(date);
  
  const prisma = await getWhitehousePrisma();

  // Get time_id for the date
  const timeRecord = await prisma.dimTime.findUnique({
    where: {
      date: dateObj,
    },
  });

  if (!timeRecord) {
    return [];
  }

  // Get aggregated stats for all stations on this date
  const stats = await prisma.aggDailyStats.findMany({
    where: {
      time_id: timeRecord.time_id,
    },
    include: {
      station: true,
    },
  });

  // Get peak hours for each station
  const peakHoursData = await prisma.factPeakHours.findMany({
    where: {
      time_id: timeRecord.time_id,
    },
    orderBy: {
      peak_score: 'desc',
    },
  });

  // Group peak hours by station
  const peakHoursByStation = {};
  peakHoursData.forEach((ph) => {
    const sid = ph.station_id || 'all';
    if (!peakHoursByStation[sid]) {
      peakHoursByStation[sid] = [];
    }
    peakHoursByStation[sid].push(ph.hour_of_day);
  });

  return stats.map((stat) => ({
    stationId: stat.station_id || 'unknown',
    date: date,
    revenue: Number(stat.total_revenue),
    rentals: stat.total_bookings,
    utilization: stat.avg_booking_duration_hours 
      ? (Number(stat.avg_booking_duration_hours) / 24) * 100 
      : 0,
    peakHours: peakHoursByStation[stat.station_id || 'all']?.slice(0, 3) || [],
  }));
}

