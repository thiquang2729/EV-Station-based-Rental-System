import { connectRabbitMq } from './mq.connection.js';

const EXCHANGE = 'evrental';

let channel;

export async function initMq() {
  const conn = await connectRabbitMq({ purpose: 'payment-svc publisher' });
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  console.log('[MQ] payment-svc connected');
}

export async function publishPaymentSucceeded({ bookingId, paymentId, amount }) {
  if (!channel) return;
  const routingKey = 'payment.succeeded';
  const payload = Buffer.from(JSON.stringify({
    bookingId: String(bookingId),
    paymentId: String(paymentId),
    amount: Number(amount),
    status: 'SUCCEEDED',
    at: new Date().toISOString()
  }));
  channel.publish(EXCHANGE, routingKey, payload, { persistent: true, contentType: 'application/json' });
}


