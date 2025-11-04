import * as service from '../services/pos.service.js';

export async function collectPayment(req,res,next){
  try {
    const result = await service.collectAtPOS(req.body, req.user);
    res.status(201).json(result);
  } catch(err){ next(err); }
}
