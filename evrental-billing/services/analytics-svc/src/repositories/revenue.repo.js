import { getWhitehousePrisma } from '../dao/whitehouse.prisma.js';

export async function getRevenueDaily(from, to){
  try {
    const prisma = await getWhitehousePrisma();
    
    // Query từ whitehouse fact_payment
    const payments = await prisma.factPayment.findMany({
      where: {
        status: 'SUCCEEDED',
        created_at: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        time: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Group by date
    const grouped = {};
    payments.forEach((payment) => {
      const dateKey = payment.time.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = 0;
      }
      grouped[dateKey] += Number(payment.amount);
    });

    // Convert to array format
    return Object.entries(grouped).map(([date, total]) => ({
      date,
      total: Number(total),
    }));
  } catch (error) {
    console.error('Error getting revenue daily from whitehouse:', error.message);
    // Return empty array if whitehouse is not available
    return [];
  }
}


