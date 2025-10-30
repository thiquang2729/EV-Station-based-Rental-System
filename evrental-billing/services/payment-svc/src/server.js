import app from './app.js';
import { initMq } from './mq.js';
import { startIntentConsumer } from './mq.intent.consumer.js';

const port = process.env.PORT || 8082;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[payment-svc] listening on :${port}`);
});

initMq().catch(err => console.error('RabbitMQ init failed:', err));
startIntentConsumer().catch(err => console.error('Intent consumer init failed:', err));


