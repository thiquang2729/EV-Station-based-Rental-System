import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

/**
 * Get peak hours for today from fact_booking table
 * Groups by hour (0-23) and counts bookings per hour
 * @param {string} stationId - Optional station ID filter
 * @returns {Promise<Array<{hour: number, bookingCount: number}>>}
 */
export async function getPeakHoursForToday(stationId = null) {
  try {
    const prisma = await getWhitehousePrisma();
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Query bookings for today
    const bookings = await prisma.factBooking.findMany({
      where: {
        start_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
        ...(stationId && { station_id: stationId }),
      },
      select: {
        start_time: true,
      },
    });

    // Initialize array for all 24 hours (0-23)
    const hourlyData = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = {
        hour,
        bookingCount: 0,
      };
    }

    // Group bookings by hour
    bookings.forEach((booking) => {
      const startTime = new Date(booking.start_time);
      const hour = startTime.getHours();
      
      if (hourlyData[hour]) {
        hourlyData[hour].bookingCount += 1;
      }
    });

    // Convert to array and return
    return Object.values(hourlyData);
  } catch (error) {
    console.error('Error getting peak hours for today from whitehouse:', error.message);
    // Return empty data for all 24 hours
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      bookingCount: 0,
    }));
  }
}
