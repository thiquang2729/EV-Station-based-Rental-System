import * as service from '../services/pos.service.js';

export async function collectPayment(req,res,next){
  try {
    const result = await service.collectAtPOS(req.body, req.user);
    res.status(201).json(result);
  } catch(err){ next(err); }
}

export async function confirmPayment(req,res,next){
  try {
    const { paymentId } = req.params;
    const result = await service.confirmPOSPayment(paymentId, req.user);
    res.json(result);
  } catch(err){ next(err); }
}