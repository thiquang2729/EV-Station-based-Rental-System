import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

/**
 * Get rental hours by date from fact_booking table
 * Groups by hour (0-23) and calculates total rental hours and booking count
 * @param {string} date - Date in format YYYY-MM-DD
 * @param {string} stationId - Optional station ID filter
 * @returns {Promise<Array<{hour: number, rentalHours: number, bookingCount: number}>>}
 */
export async function getRentalHoursByDate(date, stationId = null) {
  try {
    const prisma = await getWhitehousePrisma();
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Query bookings for the specific date
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
        duration_hours: true,
      },
    });

    // Initialize array for all 24 hours (0-23)
    const hourlyData = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = {
        hour,
        rentalHours: 0,
        bookingCount: 0,
      };
    }

    // Group bookings by hour
    bookings.forEach((booking) => {
      const startTime = new Date(booking.start_time);
      const hour = startTime.getHours();
      
      if (hourlyData[hour]) {
        hourlyData[hour].bookingCount += 1;
        // Add duration_hours if available, otherwise estimate from start_time
        if (booking.duration_hours) {
          hourlyData[hour].rentalHours += Number(booking.duration_hours) || 0;
        }
      }
    });

    // Convert to array and return
    return Object.values(hourlyData);
  } catch (error) {
    console.error('Error getting rental hours by date from whitehouse:', error.message);
    // Return empty data for all 24 hours
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      rentalHours: 0,
      bookingCount: 0,
    }));
  }
}
