import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const MAX_ATTEMPTS = Number(process.env.RABBITMQ_MAX_ATTEMPTS || 10);
const RETRY_DELAY_MS = Number(process.env.RABBITMQ_RETRY_DELAY_MS || 2000);

const RETRYABLE_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN']);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectRabbitMq({ purpose } = {}) {
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      if (purpose) {
        console.log(`[MQ] ${purpose} connected (attempt ${attempt})`);
      }
      return connection;
    } catch (error) {
      const isRetryable = RETRYABLE_CODES.has(error.code);
      const shouldRetry = attempt < MAX_ATTEMPTS && isRetryable;

      console.warn(`[MQ] ${purpose || 'connection'} failed (attempt ${attempt}): ${error.message}`);

      if (!shouldRetry) {
        throw error;
      }

      await delay(RETRY_DELAY_MS);
    }
  }
}
