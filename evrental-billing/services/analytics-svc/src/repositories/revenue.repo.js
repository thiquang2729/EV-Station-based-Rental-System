import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

export async function getRevenueDaily(from, to){
  try {
    const prisma = await getWhitehousePrisma();
    
    // Query từ whitehouse fact_booking (thay vì fact_payment)
    const bookings = await prisma.factBooking.findMany({
      where: {
        start_time: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: {
        start_time: true,
        price_estimate: true,
      },
      orderBy: {
        start_time: 'desc',
      },
    });

    // Group by date (extract date from start_time)
    const grouped = {};
    bookings.forEach((booking) => {
      const startTime = new Date(booking.start_time);
      const dateKey = startTime.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = 0;
      }
      grouped[dateKey] += Number(booking.price_estimate) || 0;
    });

    // Convert to array format and sort by date
    return Object.entries(grouped)
      .map(([date, total]) => ({
        date,
        total: Number(total),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error getting revenue daily from whitehouse:', error.message);
    // Return empty array if whitehouse is not available
    return [];
  }
}


