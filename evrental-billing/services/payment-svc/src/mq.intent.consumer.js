import * as prepo from './repositories/payment.repo.js';
import { PaymentMethod, PaymentType, PaymentStatus } from './utils/enums.js';
import { connectRabbitMq } from './mq.connection.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EXCHANGE = 'evrental';
const QUEUE = 'payment.intent.request.q';
const ROUTING_KEY = 'payment.intent.request';

export async function startIntentConsumer(){
  const conn = await connectRabbitMq({ purpose: 'payment-svc intent consumer' });
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertQueue(QUEUE, { durable: true });
  await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  await ch.consume(QUEUE, async (msg) => {
    try {
      const payload = JSON.parse(msg.content.toString());
      const bookingId = String(payload.bookingId);
      const amount = Number(payload.amount);
      const renterId = payload.userId ? String(payload.userId) : 'unknown';
      const stationId = payload.stationId ? String(payload.stationId) : 'unknown';
      const stationName = payload.stationName ? String(payload.stationName) : null;

      // Lưu stationId từ RabbitMQ message vào cache (sử dụng Payment table với status CANCELED làm cache)
      // Hoặc tạo một payment "cache" với status CANCELED để lưu stationId
      // Cách đơn giản hơn: Lưu vào một payment với method đặc biệt hoặc vào metadata
      // Nhưng đơn giản nhất: Tạo payment với stationId từ RabbitMQ, sau đó khi tạo payment intent sẽ lấy từ đó
      
      // Kiểm tra xem đã có payment nào cho booking này chưa
      const existing = await prepo.listPayments({ bookingId, status: PaymentStatus.PENDING, limit: 10 });
      
      // Lưu stationId và stationName vào IdempotencyKey table như một cache (sử dụng bookingId làm key)
      try {
        await prisma.idempotencyKey.upsert({
          where: { key: `booking_station_${bookingId}` },
          update: {
            scope: 'booking_station_cache',
            status: 'cached',
            response: { stationId, stationName, renterId, amount, receivedAt: new Date().toISOString() },
            createdAt: new Date()
          },
          create: {
            key: `booking_station_${bookingId}`,
            scope: 'booking_station_cache',
            status: 'cached',
            response: { stationId, stationName, renterId, amount, receivedAt: new Date().toISOString() }
          }
        });
        console.log(`[MQ INTENT] Cached stationId ${stationId} and stationName ${stationName || 'N/A'} for booking ${bookingId} from RabbitMQ message`);
      } catch (cacheError) {
        console.error(`[MQ INTENT] Failed to cache stationId for booking ${bookingId}:`, cacheError.message);
      }

      // idempotent: nếu đã có payment PENDING cho bookingId (bất kỳ method nào) thì bỏ qua
      // KHÔNG tự động tạo payment VNPAY nữa - để user chọn method thanh toán
      if (!existing || existing.length === 0) {
        console.log(`[MQ INTENT] Received payment intent request for booking ${bookingId} with stationId ${stationId}, but skipping auto-create. User will choose payment method.`);
      } else {
        console.log(`[MQ INTENT] Booking ${bookingId} already has ${existing.length} PENDING payment(s), skipping auto-create.`);
      }

      ch.ack(msg);
    } catch (e) {
      console.error('intent consumer error:', e);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('[MQ] payment-svc consuming payment.intent.request...');
}


