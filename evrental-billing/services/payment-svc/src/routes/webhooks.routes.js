import { Router } from 'express';
import * as ctrl from '../controllers/webhooks.controller.js';

const r = Router();

// Public endpoints - no auth required
r.get('/return', ctrl.vnpayReturn);
r.get('/ipn', ctrl.vnpayIpn);

export default r;
