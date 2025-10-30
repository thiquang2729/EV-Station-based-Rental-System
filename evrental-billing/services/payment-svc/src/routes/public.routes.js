import { Router } from 'express';
import * as prepo from '../repositories/payment.repo.js';
import * as vnp from '../services/vnpay.service.js';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';

const r = Router();

// Public: tạo/cấp redirectUrl VNPay theo bookingId (không cần JWT)
r.post('/payments/intents', async (req, res, next) => {
  try {
    const { bookingId, amount, description } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId required' });
    }

    let payment = (await prepo.listPayments({ bookingId, status: PaymentStatus.PENDING, limit: 1 }))[0];
    if (!payment) {
      if (!amount) {
        return res.status(400).json({ success: false, message: 'amount required to create intent' });
      }
      const txnRef = vnp.newTxnRef();
      payment = await prepo.createPayment({
        bookingId,
        renterId: 'public',
        stationId: 'unknown',
        amount: Number(amount),
        method: PaymentMethod.VNPAY,
        type: PaymentType.RENTAL_FEE,
        description: description || `EVR Payment ${bookingId}`,
        vnpTxnRef: txnRef,
        vnpOrderInfo: description || `EVR Booking ${bookingId}`
      });
    }

    // ensure txn ref
    if (!payment.vnpTxnRef) {
      const updates = { vnpTxnRef: vnp.newTxnRef(), vnpOrderInfo: payment.description || null };
      if (typeof prepo.updateById === 'function') {
        payment = await prepo.updateById(payment.id, updates);
      } else {
        // fallback: naive merge if repo has no updateById; skip to use payment as-is
        payment = { ...payment, ...updates };
      }
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const redirectUrl = await vnp.buildRedirect(payment, ipAddr, {
      locale: (process.env.VNPAY_DEFAULT_LOCALE || 'vn').toLowerCase(),
      orderInfo: payment.vnpOrderInfo || payment.description || `EVR Payment ${payment.id}`
    });
    return res.json({ success: true, data: { paymentId: payment.id, status: payment.status, redirectUrl } });
  } catch (e) {
    next(e);
  }
});

export default r;


