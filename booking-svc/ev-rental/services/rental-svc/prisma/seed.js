const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const st = await prisma.station.create({
    data: { name: 'Station 01', address: '1 ABC St', lat: 10.77, lng: 106.69 }
  });
  // await prisma.vehicle.createMany({
  //   data: [
  //     { stationId: st.id, type: 'scooter', plate: '59A1-00001', batteryLevel: 85, pricePerDay: 20000 },
  //     { stationId: st.id, type: 'scooter', plate: '59A1-00002', batteryLevel: 65, pricePerDay: 18000 }
  //   ]
  // });
  console.log('Seeded rental data');
}
main().finally(() => prisma.$disconnect());
