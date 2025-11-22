import * as prepo from './repositories/payment.repo.js';
import { PaymentMethod, PaymentType, PaymentStatus } from './utils/enums.js';
import { connectRabbitMq } from './mq.connection.js';

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

      // idempotent: nếu đã có payment PENDING cho bookingId (bất kỳ method nào) thì bỏ qua
      // KHÔNG tự động tạo payment VNPAY nữa - để user chọn method thanh toán
      const existing = await prepo.listPayments({ bookingId, status: PaymentStatus.PENDING, limit: 10 });
      if (!existing || existing.length === 0) {
        // Chỉ tạo payment VNPAY nếu chưa có payment nào (giữ lại logic cũ cho backward compatibility)
        // Nhưng tốt hơn là không tạo gì cả, để user chọn method
        console.log(`[MQ INTENT] Received payment intent request for booking ${bookingId}, but skipping auto-create. User will choose payment method.`);
        // Không tạo payment tự động - để user chọn method thanh toán (CASH hoặc VNPAY)
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


