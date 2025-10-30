import { Router } from 'express';
const r = Router();
r.get('/', (req,res)=> res.json({ service: 'analytics-svc', status: 'ok' }));
export default r;
