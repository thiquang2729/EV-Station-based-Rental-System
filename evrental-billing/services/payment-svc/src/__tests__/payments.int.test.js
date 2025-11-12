// Minimal smoke test using supertest-like fetch to local app
import app from '../app.js';
import http from 'http';

function startServer(){
  return new Promise((resolve)=>{
    const server = http.createServer(app);
    server.listen(0, ()=>resolve(server));
  });
}

async function request(server, method, path, body){
  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers:{ 'content-type':'application/json' },
    body: body? JSON.stringify(body): undefined
  });
  const json = await res.json();
  return { status: res.status, json };
}

// Note: requires DATABASE_URL pointing to test DB and prisma schema existing
test('create intent VNPAY returns redirectUrl', async ()=>{
  const server = await startServer();
  try{
    const { status, json } = await request(server, 'POST', '/api/v1/payments/intents', {
      bookingId: 'B1', renterId:'U1', stationId:'S1', amount: 10000, method: 'VNPAY', type: 'RENTAL_FEE'
    });
    expect(status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.redirectUrl).toBeTruthy();
  } finally{
    server.close();
  }
});


