import * as vnp from '../services/vnpay.service.js';
import * as idempotency from '../services/idempotency.service.js';
import * as payments from '../services/payments.service.js';
import * as rental from '../services/rental.client.js';
import * as prepo from '../repositories/payment.repo.js';
import { PaymentStatus } from '../utils/enums.js';
import { publishPaymentSucceeded } from '../mq.js';

function parseVnpPayDate(value) {
  if (!value) {
    return null;
  }
  const text = String(value);
  if (text.length !== 14) {
    return null;
  }
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6)) - 1;
  const day = Number(text.slice(6, 8));
  const hour = Number(text.slice(8, 10));
  const minute = Number(text.slice(10, 12));
  const second = Number(text.slice(12, 14));
  if ([year, month, day, hour, minute, second].some((num) => Number.isNaN(num))) {
    return null;
  }
  return new Date(year, month, day, hour, minute, second);
}

export async function vnpayReturn(req, res) {
  const verification = vnp.verify(req.query);

  if (!verification.ok) {
    return res.status(400).send('INVALID_HASH');
  }

  const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_PayDate } = verification.data;
  const rawData = verification.data.raw || {};
  const parsedPayDate = parseVnpPayDate(rawData.vnp_Pay_Date ?? rawData.vnp_PayDate ?? vnp_PayDate);
  const paymentMetadata = Object.fromEntries(
    Object.entries({
      vnpResponseCode: rawData.vnp_ResponseCode ?? vnp_ResponseCode ?? undefined,
      vnpPayDate: parsedPayDate ?? undefined,
      vnpBankCode: rawData.vnp_BankCode ?? undefined,
      vnpCardType: rawData.vnp_CardType ?? undefined,
      vnpOrderInfo: rawData.vnp_OrderInfo ?? undefined,
      vnpSecureHash: rawData.vnp_SecureHash ?? undefined
    }).filter(([, value]) => value !== undefined)
  );

  if (!vnp_TxnRef) {
    return res.status(400).send('MISSING_TXN_REF');
  }

  const idempotencyKey = `${vnp_TxnRef}:${vnp_TransactionNo || parsedPayDate?.toISOString() || 'return'}`;
  const scope = 'VNPAY_RETURN';

  try {
    await idempotency.ensure(idempotencyKey, scope);

    const payment = await prepo.getPaymentByTxnRef(vnp_TxnRef);
    if (!payment) {
      await idempotency.markFailed(idempotencyKey, scope, 'PAYMENT_NOT_FOUND');
      return res.status(404).send('PAYMENT_NOT_FOUND');
    }

    let finalStatus = payment.status;

    if (vnp_ResponseCode === '00') {
      if (payment.status === PaymentStatus.PENDING) {
        await prepo.updateStatus(payment.id, PaymentStatus.SUCCEEDED, { extraData: paymentMetadata });
        await prepo.createTransaction({
          paymentId: payment.id,
          fromStatus: payment.status,
          toStatus: PaymentStatus.SUCCEEDED,
          amount: payment.amount,
          actorId: null,
          meta: { kind: 'VNPAY_SUCCESS_RETURN', message: 'VNPAY return marked success', raw: rawData }
        });
        await rental.markBookingPaid(payment.bookingId, payment.id);
        await publishPaymentSucceeded({ bookingId: payment.bookingId, paymentId: payment.id, amount: payment.amount });
        finalStatus = PaymentStatus.SUCCEEDED;
      }
      await idempotency.markSucceeded(idempotencyKey, scope);
    } else {
      if (payment.status === PaymentStatus.PENDING) {
        await prepo.updateStatus(payment.id, PaymentStatus.FAILED, { extraData: paymentMetadata });
        await prepo.createTransaction({
          paymentId: payment.id,
          fromStatus: payment.status,
          toStatus: PaymentStatus.FAILED,
          amount: payment.amount,
          actorId: null,
          meta: { kind: 'VNPAY_FAILED_RETURN', message: `VNPAY payment failed: ${vnp_ResponseCode}`, raw: rawData }
        });
        finalStatus = PaymentStatus.FAILED;
      }
      await idempotency.markFailed(idempotencyKey, scope, `VNPAY_ERROR_${vnp_ResponseCode || 'UNKNOWN'}`);
    }

    const displayStatus = finalStatus === PaymentStatus.SUCCEEDED ? 'SUCCESS' : 'FAILED';
    const successUrl = process.env.FRONTEND_SUCCESS_URL;
    if (successUrl) {
      const target = new URL(successUrl);
      target.searchParams.set('bookingId', payment.bookingId);
      target.searchParams.set('paymentId', payment.id);
      target.searchParams.set('vnp_status', displayStatus.toLowerCase());
      return res.redirect(302, target.toString());
    }
    return res.send(`Payment ${displayStatus}. You can close this window.`);
  } catch (error) {
    if (error.message === 'IDEMPOTENT_KEY_ALREADY_SUCCEEDED') {
      const status = vnp_ResponseCode === '00' ? 'SUCCESS' : 'FAILED';
      return res.send(`Payment ${status}. You can close this window.`);
    }
    console.error('VNPAY return handler error:', error);
    try {
      await idempotency.markFailed(idempotencyKey, scope, error.message);
    } catch (_) {
      // ignore secondary failures
    }
    return res.status(500).send('INTERNAL_ERROR');
  }
}

export async function vnpayIpn(req, res) {
  const verification = vnp.verifyIpn(req.query);

  if (!verification.ok) {
    return res.status(400).send('INVALID_HASH');
  }

  const { vnp_TxnRef, vnp_ResponseCode, vnp_TransactionNo, vnp_PayDate } = verification.data;

  // Generate idempotency key
  const idempotencyKey = `${vnp_TxnRef}:${vnp_TransactionNo || vnp_PayDate}`;
  const scope = 'VNPAY_IPN';

  try {
    // Ensure idempotency
    await idempotency.ensure(idempotencyKey, scope);

    // Find payment by transaction reference
    const payment = await prepo.getPaymentByTxnRef(vnp_TxnRef);
    if (!payment) {
      await idempotency.markFailed(idempotencyKey, scope, 'PAYMENT_NOT_FOUND');
      return res.status(404).send('PAYMENT_NOT_FOUND');
    }

    const rawData = verification.data.raw || {};
    const parsedPayDate = parseVnpPayDate(rawData.vnp_PayDate ?? vnp_PayDate);
    const paymentMetadata = Object.fromEntries(
      Object.entries({
        vnpResponseCode: rawData.vnp_ResponseCode ?? vnp_ResponseCode ?? undefined,
        vnpTransactionNo: rawData.vnp_TransactionNo ?? vnp_TransactionNo ?? undefined,
        vnpPayDate: parsedPayDate ?? undefined,
        vnpBankCode: rawData.vnp_BankCode ?? undefined,
        vnpCardType: rawData.vnp_CardType ?? undefined,
        vnpOrderInfo: rawData.vnp_OrderInfo ?? undefined,
        vnpSecureHash: rawData.vnp_SecureHash ?? undefined
      }).filter(([, value]) => value !== undefined)
    );

    if (vnp_ResponseCode === '00') {
      // Payment succeeded
      await prepo.updateStatus(payment.id, PaymentStatus.SUCCEEDED, { extraData: paymentMetadata });
      await prepo.createTransaction({
        paymentId: payment.id,
        fromStatus: payment.status,
        toStatus: PaymentStatus.SUCCEEDED,
        amount: payment.amount,
        actorId: null,
        meta: { kind: 'VNPAY_SUCCESS', message: 'VNPAY payment succeeded', raw: rawData }
      });

      // Notify rental service
      await rental.markBookingPaid(payment.bookingId, payment.id);
      await publishPaymentSucceeded({ bookingId: payment.bookingId, paymentId: payment.id, amount: payment.amount });

      await idempotency.markSucceeded(idempotencyKey, scope);
    } else {
      // Payment failed
      await prepo.updateStatus(payment.id, PaymentStatus.FAILED, { extraData: paymentMetadata });
      await prepo.createTransaction({
        paymentId: payment.id,
        fromStatus: payment.status,
        toStatus: PaymentStatus.FAILED,
        amount: payment.amount,
        actorId: null,
        meta: { kind: 'VNPAY_FAILED', message: `VNPAY payment failed: ${vnp_ResponseCode}`, raw: rawData }
      });

      await idempotency.markFailed(idempotencyKey, scope, `VNPAY_ERROR_${vnp_ResponseCode}`);
    }

    return res.send('OK');
  } catch (error) {
    if (error.message === 'IDEMPOTENT_KEY_ALREADY_SUCCEEDED') {
      // Already processed, return OK
      return res.send('OK');
    }

    // Mark as failed and rethrow
    await idempotency.markFailed(idempotencyKey, scope, error.message);
    throw error;
  }
}
