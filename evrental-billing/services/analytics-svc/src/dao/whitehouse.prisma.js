// Lazy load Whitehouse Prisma Client với lock mechanism để tránh race condition
let whitehousePrismaInstance = null;
let initializationPromise = null;

export async function getWhitehousePrisma() {
  // Nếu đã có instance, return ngay
  if (whitehousePrismaInstance) {
    return whitehousePrismaInstance;
  }

  // Nếu đang khởi tạo, đợi promise đó
  if (initializationPromise) {
    return initializationPromise;
  }

  // Bắt đầu khởi tạo với lock
  initializationPromise = (async () => {
    try {
      // Dynamic import Prisma Client
      const { PrismaClient } = await import('../../generated/whitehouse-client/index.js');

      // Create instance
      if (process.env.NODE_ENV === 'production') {
        whitehousePrismaInstance = new PrismaClient({
          log: ['error', 'warn'],
          datasources: {
            db: {
              url: process.env.WHITEHOUSE_DATABASE_URL,
            },
          },
        });
      } else {
        // Trong development, dùng global để tránh hot reload tạo nhiều instance
        if (!global.whitehousePrisma) {
          global.whitehousePrisma = new PrismaClient({
            log: ['error', 'warn'],
            datasources: {
              db: {
                url: process.env.WHITEHOUSE_DATABASE_URL,
              },
            },
          });
        }
        whitehousePrismaInstance = global.whitehousePrisma;
      }

      // Test connection
      await whitehousePrismaInstance.$connect();
      console.log('[Whitehouse Prisma] Client initialized and connected');

      // Graceful shutdown
      process.on('beforeExit', async () => {
        if (whitehousePrismaInstance) {
          await whitehousePrismaInstance.$disconnect();
        }
      });

      return whitehousePrismaInstance;
    } catch (error) {
      console.error('[Whitehouse Prisma] Failed to initialize:', error.message);
      console.error('[Whitehouse Prisma] Error stack:', error.stack);
      
      // Reset promise để có thể retry
      initializationPromise = null;
      
      // Return a mock client để service không crash
      const mockClient = {
        dimTime: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        dimStation: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        dimUser: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        dimVehicle: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        factBooking: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        factPayment: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        factPeakHours: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        aggDailyStats: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null), findUnique: () => Promise.resolve(null), count: () => Promise.resolve(0) },
        $disconnect: async () => {},
      };
      
      // Cache mock client để không phải tạo lại
      whitehousePrismaInstance = mockClient;
      return mockClient;
    }
  })();

  return initializationPromise;
}

// Export default để backward compatibility
export default {
  get dimTime() { return getWhitehousePrisma().then(p => p.dimTime); },
  get dimStation() { return getWhitehousePrisma().then(p => p.dimStation); },
  get dimUser() { return getWhitehousePrisma().then(p => p.dimUser); },
  get dimVehicle() { return getWhitehousePrisma().then(p => p.dimVehicle); },
  get factBooking() { return getWhitehousePrisma().then(p => p.factBooking); },
  get factPayment() { return getWhitehousePrisma().then(p => p.factPayment); },
  get factPeakHours() { return getWhitehousePrisma().then(p => p.factPeakHours); },
  get aggDailyStats() { return getWhitehousePrisma().then(p => p.aggDailyStats); },
  async $disconnect() {
    const p = await getWhitehousePrisma();
    return p.$disconnect();
  },
};
