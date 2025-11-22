import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

export const initWhitehouseConnection = async () => {
  if (!process.env.WHITEHOUSE_DATABASE_URL) {
    console.warn('WHITEHOUSE_DATABASE_URL is not set. Skipping Whitehouse connection.');
    return;
  }
  try {
    // Test connection by querying dim_time table
    const prisma = await getWhitehousePrisma();
    await prisma.dimTime.findFirst({
      take: 1,
    });
    console.log('Connected to Whitehouse Database via Prisma');
  } catch (error) {
    console.error('Failed to connect to Whitehouse Database:', error.message);
    console.error('Error details:', error);
  }
};

export const getWhitehouseData = async (query, params = []) => {
  // This is kept for backward compatibility
  // New code should use whitehousePrisma directly
  throw new Error('Use whitehousePrisma directly instead of getWhitehouseData');
};

export const getAggregatedStats = async () => {
  try {
    const prisma = await getWhitehousePrisma();
    const timeCount = await prisma.dimTime.count();
    const stationCount = await prisma.dimStation.count();
    const bookingCount = await prisma.factBooking.count();
    const paymentCount = await prisma.factPayment.count();
    
    return {
      timeRecords: timeCount,
      stations: stationCount,
      bookings: bookingCount,
      payments: paymentCount,
    };
  } catch (e) {
    return { error: e.message };
  }
};
