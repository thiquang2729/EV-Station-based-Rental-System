import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

export async function getRevenueByStation(stationId, from, to, granularity) {
  try {
    const prisma = await getWhitehousePrisma();
    
    // Get time_ids for the date range
    const timeRecords = await prisma.dimTime.findMany({
      where: {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    const timeIds = timeRecords.map((t) => t.time_id);

    // Query payments from whitehouse
    const payments = await prisma.factPayment.findMany({
      where: {
        station_id: stationId,
        status: 'SUCCEEDED',
        time_id: {
          in: timeIds,
        },
      },
      include: {
        time: true,
      },
    });

    // Group by granularity
    const grouped = {};
    payments.forEach((payment) => {
      let key;
      if (granularity === 'day') {
        key = payment.time.date.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        key = `${payment.time.year}-W${String(payment.time.week).padStart(2, '0')}`;
      } else {
        key = `${payment.time.year}-${String(payment.time.month).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, revenue: 0, transactionCount: 0 };
      }
      grouped[key].revenue += Number(payment.amount);
      grouped[key].transactionCount += 1;
    });

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Error getting revenue by station from whitehouse:', error.message);
    return [];
  }
}

export async function getUtilizationByStation(stationId, from, to) {
  try {
    const prisma = await getWhitehousePrisma();
    
    // Get time_ids for the date range
    const timeRecords = await prisma.dimTime.findMany({
      where: {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    const timeIds = timeRecords.map((t) => t.time_id);

    // Query bookings from whitehouse
    const bookings = await prisma.factBooking.findMany({
      where: {
        station_id: stationId,
        status: 'COMPLETED',
        time_id: {
          in: timeIds,
        },
      },
      include: {
        time: true,
      },
    });

    // Calculate total rental hours
    let totalRentalHours = 0;
    bookings.forEach((booking) => {
      if (booking.end_time && booking.start_time) {
        const hours = (new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60 * 60);
        totalRentalHours += hours;
      } else if (booking.duration_hours) {
        totalRentalHours += Number(booking.duration_hours);
      }
    });

    // Calculate total available hours (24 hours * number of days)
    const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
    const totalAvailableHours = 24 * daysDiff;

    return {
      stationId,
      totalRentals: bookings.length,
      totalRentalHours,
      totalAvailableHours,
    };
  } catch (error) {
    console.error('Error getting utilization by station from whitehouse:', error.message);
    return { stationId, totalRentals: 0, totalRentalHours: 0, totalAvailableHours: 0 };
  }
}

export async function getPeakHoursByStation(stationId, from, to) {
  try {
    const prisma = await getWhitehousePrisma();
    
    // Get time_ids for the date range
    const timeRecords = await prisma.dimTime.findMany({
      where: {
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
    });

    const timeIds = timeRecords.map((t) => t.time_id);

    // Query peak hours from whitehouse
    const peakHours = await prisma.factPeakHours.findMany({
      where: {
        station_id: stationId,
        time_id: {
          in: timeIds,
        },
      },
      orderBy: {
        peak_score: 'desc',
      },
      take: 5,
    });

    return peakHours.map((ph) => ph.hour_of_day);
  } catch (error) {
    console.error('Error getting peak hours by station from whitehouse:', error.message);
    return [];
  }
}
