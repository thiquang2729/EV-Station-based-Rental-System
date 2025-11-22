const amqp = require('amqplib');
const prisma = require('./prisma');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EXCHANGE = 'evrental';
const RESULT_QUEUE = 'booking.payment.result';
const ROUTING_KEY = 'payment.succeeded';
const INTENT_ROUTING_KEY = 'payment.intent.request';

async function handlePaymentSucceeded(msg) {
  try {
    const payload = JSON.parse(msg.content.toString());
    console.log(`[MQ] Received payment.succeeded message:`, payload);
    
    const { bookingId, paymentId, amount, status } = payload || {};
    if (!bookingId || !paymentId) {
      console.log(`[MQ] Missing bookingId or paymentId, skipping. bookingId=${bookingId}, paymentId=${paymentId}`);
      return;
    }
    
    if (status !== 'SUCCEEDED') {
      console.log(`[MQ] Status is not SUCCEEDED (status=${status}), skipping`);
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id: String(bookingId) } });
    if (!booking) {
      console.log(`[MQ] Booking ${bookingId} not found, skipping`);
      return;
    }
    
    if (booking.status !== 'PENDING') {
      console.log(`[MQ] Booking ${bookingId} status is ${booking.status}, not PENDING. Skipping.`);
      return;
    }

    console.log(`[MQ] Processing payment succeeded for booking ${bookingId}, vehicle ${booking.vehicleId}`);
    
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: String(bookingId) },
        data: {
          status: 'CONFIRMED',
          paymentId: String(paymentId)
        }
      }),
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { isAvailable: false }
      })
    ]);
    console.log(`[MQ] ✓ Updated booking ${bookingId} to CONFIRMED and locked vehicle ${booking.vehicleId}`);
  } catch (error) {
    console.error(`[MQ] Error handling payment.succeeded:`, error);
    throw error; // Re-throw để nack message
  }
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


async function publishPaymentIntentRequest({ bookingId, userId, stationId, stationName, amount }){
  const conn = await amqp.connect(RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  const payload = Buffer.from(JSON.stringify({
    bookingId: String(bookingId),
    userId: userId ? String(userId) : 'unknown',
    stationId: stationId ? String(stationId) : null,
    stationName: stationName ? String(stationName) : null,
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

