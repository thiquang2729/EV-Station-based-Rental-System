import app from './app.js';

const port = process.env.PORT || 8083;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[analytics-svc] listening on :${port}`);
});


