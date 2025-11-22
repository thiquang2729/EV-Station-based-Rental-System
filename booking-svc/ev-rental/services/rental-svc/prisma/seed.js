const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.booking.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.station.deleteMany({});
  
  console.log('Cleared existing data');
  
  // Create station
  const st = await prisma.station.create({
    data: { name: 'Station 01', address: '1 ABC St', lat: 10.77, lng: 106.69 }
  });
  
  console.log('Created station:', st.id);
  
  // Create vehicles
  const vehicles = await prisma.vehicle.createMany({
    data: [
      { name: 'EV Scooter 01', stationId: st.id, type: 'scooter', plate: '59A1-00001', batteryLevel: 85, pricePerDay: 20000 },
      { name: 'EV Scooter 02', stationId: st.id, type: 'scooter', plate: '59A1-00002', batteryLevel: 65, pricePerDay: 18000 },
      { name: 'EV Bike 01', stationId: st.id, type: 'bike', plate: '59B1-00001', batteryLevel: 90, pricePerDay: 30000 },
      { name: 'EV Car 01', stationId: st.id, type: 'car', plate: '59C1-00001', batteryLevel: 100, pricePerDay: 100000 }
    ]
  });
  
  console.log('Created vehicles count:', vehicles.count);
  
  const allVehicles = await prisma.vehicle.findMany();
  console.log('Total vehicles in DB:', allVehicles.length);
  
  console.log('Seeded rental data successfully!');
}
main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
