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

      // idempotent: nếu đã có payment PENDING cho bookingId thì bỏ qua
      const existing = await prepo.listPayments({ bookingId, status: PaymentStatus.PENDING, limit: 1 });
      if (!existing || existing.length === 0) {
        await prepo.createPayment({
          bookingId,
          renterId,
          stationId,
          amount,
          method: PaymentMethod.VNPAY,
          type: PaymentType.RENTAL_FEE,
          description: `EVR Booking ${bookingId}`
        });
      }

      ch.ack(msg);
    } catch (e) {
      console.error('intent consumer error:', e);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('[MQ] payment-svc consuming payment.intent.request...');
}


