const amqp = require('amqplib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = 'evrental';
const RESULT_QUEUE = 'booking.payment.result';
const ROUTING_KEY = 'payment.succeeded';
const INTENT_ROUTING_KEY = 'payment.intent.request';

async function handlePaymentSucceeded(msg) {
  const payload = JSON.parse(msg.content.toString());
  const { bookingId, paymentId, amount, status } = payload || {};
  if (!bookingId || !paymentId || status !== 'SUCCEEDED') return;

  const booking = await prisma.booking.findUnique({ where: { id: String(bookingId) } });
  if (!booking) return;
  if (booking.status !== 'PENDING') return;

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: String(bookingId) },
      data: {
        status: 'CONFIRMED'
      }
    }),
    prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { isAvailable: false }
    })
  ]);
  console.log(`[MQ] Updated booking ${bookingId} to CONFIRMED and locked vehicle ${booking.vehicleId}`);
}

async function startConsumer() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  await ch.assertQueue(RESULT_QUEUE, { durable: true });
  await ch.bindQueue(RESULT_QUEUE, EXCHANGE, ROUTING_KEY);

  await ch.consume(RESULT_QUEUE, async (msg) => {
    try {
      await handlePaymentSucceeded(msg);
      ch.ack(msg);
    } catch (e) {
      console.error('MQ consume error:', e);
      ch.nack(msg, false, false);
    }
  }, { noAck: false });

  console.log('[MQ] rental-svc consuming payment results...');
}

module.exports = { startConsumer };


async function publishPaymentIntentRequest({ bookingId, userId, stationId, amount }){
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  const payload = Buffer.from(JSON.stringify({
    bookingId: String(bookingId),
    userId: userId ? String(userId) : 'unknown',
    stationId: stationId ? String(stationId) : null,
    amount: Number(amount),
    method: 'VNPAY',
    type: 'RENTAL_FEE',
    at: new Date().toISOString()
  }));
  ch.publish(EXCHANGE, INTENT_ROUTING_KEY, payload, { persistent: true, contentType: 'application/json' });
  await ch.close();
  await conn.close();
}

module.exports.publishPaymentIntentRequest = publishPaymentIntentRequest;

