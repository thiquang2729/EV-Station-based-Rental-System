import { Router } from 'express';
const r = Router();
r.get('/', (req,res)=> res.json({ service: 'payment-svc', status: 'ok' }));
export default r;
