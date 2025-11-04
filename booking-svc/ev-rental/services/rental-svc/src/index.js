const app = require('./app');
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`rental-svc (CJS) listening on :${PORT}`));
const { startConsumer } = require('./mq');
startConsumer().catch(err => console.error('RabbitMQ init failed:', err));
