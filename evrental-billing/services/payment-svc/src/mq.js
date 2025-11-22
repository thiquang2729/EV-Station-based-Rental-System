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
  if (!channel) {
    console.error('[MQ] ⚠️ Channel not initialized, attempting to initialize...');
    // Thử init lại nếu chưa có channel
    try {
      await initMq();
      if (!channel) {
        console.error('[MQ] ❌ Channel still not initialized after initMq()');
        return;
      }
    } catch (error) {
      console.error('[MQ] ❌ Failed to initialize channel:', error.message);
      console.error('[MQ] Error stack:', error.stack);
      return;
    }
  }
  
  const routingKey = 'payment.succeeded';
  const payload = {
    bookingId: String(bookingId),
    paymentId: String(paymentId),
    amount: Number(amount),
    status: 'SUCCEEDED',
    at: new Date().toISOString()
  };
  
  const payloadBuffer = Buffer.from(JSON.stringify(payload));
  
  try {
    const published = channel.publish(EXCHANGE, routingKey, payloadBuffer, { 
      persistent: true, 
      contentType: 'application/json' 
    });
    
    if (published) {
      console.log(`[MQ] ✅ Published payment.succeeded message:`, payload);
      console.log(`[MQ] Exchange: ${EXCHANGE}, RoutingKey: ${routingKey}`);
    } else {
      console.error(`[MQ] ❌ Failed to publish - channel buffer full or connection closed`);
      // Thử reconnect
      try {
        await initMq();
        const retryPublished = channel.publish(EXCHANGE, routingKey, payloadBuffer, { 
          persistent: true, 
          contentType: 'application/json' 
        });
        if (retryPublished) {
          console.log(`[MQ] ✅ Published payment.succeeded message after reconnect:`, payload);
        } else {
          console.error(`[MQ] ❌ Still failed to publish after reconnect`);
        }
      } catch (retryError) {
        console.error('[MQ] ❌ Failed to reconnect:', retryError.message);
      }
    }
  } catch (error) {
    console.error('[MQ] ❌ Exception while publishing payment.succeeded:', error.message);
    console.error('[MQ] Error stack:', error.stack);
  }
}


