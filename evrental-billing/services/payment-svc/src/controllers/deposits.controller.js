import * as service from '../services/deposits.service.js';

export async function holdDeposit(req,res,next){
  try {
    const result = await service.hold(req.body, req.user);
    res.status(201).json(result);
  } catch(err){ next(err); }
}

export async function releaseDeposit(req,res,next){
  try {
    const result = await service.release(req.params.id, req.body, req.user);
    res.json(result);
  } catch(err){ next(err); }
}

export async function forfeitDeposit(req,res,next){
  try {
    const result = await service.forfeit(req.params.id, req.body, req.user);
    res.json(result);
  } catch(err){ next(err); }
}
