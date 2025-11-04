import * as service from '../services/payments.service.js';

export async function createIntent(req,res,next){
  try {
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress || 
                   req.connection.socket.remoteAddress || 
                   '127.0.0.1';
    const result = await service.createIntent(req.body, ipAddr);
    res.status(201).json(result);
  } catch(err){ next(err); }
}

export async function getPaymentById(req,res,next){
  try {
    const result = await service.getById(req.params.id);
    res.json(result);
  } catch(err){ next(err); }
}

export async function cancelPayment(req,res,next){
  try {
    const result = await service.cancel(req.params.id);
    res.json(result);
  } catch(err){ next(err); }
}

export async function refundPayment(req,res,next){
  try {
    const result = await service.refund(req.params.id, req.body);
    res.json(result);
  } catch(err){ next(err); }
}

export async function queryPayments(req,res,next){
  try {
    const result = await service.list(req.query);
    res.json(result);
  } catch(err){ next(err); }
}
