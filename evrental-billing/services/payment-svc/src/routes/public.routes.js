import { Router } from 'express';
import * as prepo from '../repositories/payment.repo.js';
import * as vnp from '../services/vnpay.service.js';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';
import { publishPaymentSucceeded } from '../mq.js';
import * as rental from '../services/rental.client.js';

const r = Router();

// Public: tạo payment intent với phương thức thanh toán tiền mặt (CASH) theo bookingId (không cần JWT)
// Payment được tạo với status PENDING - chưa thanh toán, chưa khóa xe
r.post('/payments/intents', async (req, res, next) => {
  try {
    const { bookingId, amount, description } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId required' });
    }

    // CHỈ tìm payment CASH PENDING - không lấy payment với method khác (ví dụ VNPAY)
    const existingPayments = await prepo.listPayments({ 
      bookingId, 
      status: PaymentStatus.PENDING, 
      limit: 10 
    });
    let payment = existingPayments.find(p => p.method === PaymentMethod.CASH);
    
    // Log để debug
    if (existingPayments.length > 0) {
      console.log(`[PUBLIC] Found ${existingPayments.length} PENDING payment(s) for booking ${bookingId}. Methods:`, existingPayments.map(p => `${p.method}(${p.id})`));
      
      // Nếu có payment VNPAY PENDING nhưng không có CASH, cancel các payment VNPAY để tránh nhầm lẫn
      const vnpayPayments = existingPayments.filter(p => p.method === PaymentMethod.VNPAY);
      if (vnpayPayments.length > 0 && !payment) {
        console.log(`[PUBLIC] Found ${vnpayPayments.length} VNPAY payment(s) but no CASH. Canceling VNPAY payments to avoid confusion.`);
        // Cancel các payment VNPAY cũ
        for (const vnpayPayment of vnpayPayments) {
          try {
            await prepo.updateStatus(vnpayPayment.id, PaymentStatus.CANCELED, {
              transactionMeta: { kind: 'AUTO_CANCELED', message: 'Auto-canceled because user chose CASH payment method' }
            });
            console.log(`[PUBLIC] Canceled VNPAY payment ${vnpayPayment.id}`);
          } catch (error) {
            console.error(`[PUBLIC] Failed to cancel VNPAY payment ${vnpayPayment.id}:`, error.message);
          }
        }
      }
    }
    
    if (!payment) {
      if (!amount) {
        return res.status(400).json({ success: false, message: 'amount required to create intent' });
      }
      
      // Lấy stationId và stationName từ RabbitMQ cache (IdempotencyKey) hoặc từ booking
      let stationId = 'unknown';
      let stationName = null;
      try {
        // Ưu tiên lấy từ RabbitMQ cache
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const cache = await prisma.idempotencyKey.findUnique({
          where: { key: `booking_station_${bookingId}` }
        });
        
        if (cache && cache.response && typeof cache.response === 'object' && cache.response.stationId) {
          stationId = String(cache.response.stationId);
          stationName = cache.response.stationName ? String(cache.response.stationName) : null;
          console.log(`[PUBLIC] Got stationId ${stationId} and stationName ${stationName || 'N/A'} from RabbitMQ cache for booking ${bookingId}`);
        } else {
          // Fallback: Lấy từ booking service
          const bookingResult = await rental.getBookingById(bookingId);
          if (bookingResult.success && bookingResult.data?.stationId) {
            stationId = String(bookingResult.data.stationId);
            // Có thể lấy stationName từ booking nếu có relation
            console.log(`[PUBLIC] Got stationId ${stationId} from booking service for booking ${bookingId}`);
          } else {
            console.log(`[PUBLIC] Could not get stationId from booking ${bookingId}, using 'unknown'`);
          }
        }
        await prisma.$disconnect();
      } catch (error) {
        console.error(`[PUBLIC] Failed to get stationId for booking ${bookingId}:`, error.message);
        console.log(`[PUBLIC] Using 'unknown' as stationId`);
      }
      
      // Tạo description với tên trạm nếu có
      const paymentDescription = stationName 
        ? `${description || `EVR Payment ${bookingId}`} - Trạm: ${stationName}`
        : (description || `EVR Payment ${bookingId}`);
      
      // Tạo payment với phương thức CASH (tiền mặt) - status PENDING (chưa thanh toán)
      payment = await prepo.createPayment({
        bookingId,
        renterId: 'public',
        stationId,
        amount: Number(amount),
        method: PaymentMethod.CASH,
        type: PaymentType.RENTAL_FEE,
        description: paymentDescription,
        status: PaymentStatus.PENDING // Tạo với PENDING - chưa thanh toán, chưa khóa xe
      });
      console.log(`[PUBLIC] Created new CASH payment ${payment.id} for booking ${bookingId} with stationId ${stationId} and stationName ${stationName || 'N/A'}`);
    } else {
      console.log(`[PUBLIC] Using existing CASH payment ${payment.id} for booking ${bookingId}`);
    }

    // Trả về payment intent - chưa thanh toán, chưa gửi message qua RabbitMQ
    return res.json({ 
      success: true, 
      data: { 
        paymentId: payment.id, 
        status: payment.status,
        method: payment.method,
        message: 'Payment intent created. Please complete payment at station.'
      } 
      });
  } catch (e) {
    next(e);
  }
});

// Public: xác nhận thanh toán thành công (chỉ khi user/staff xác nhận đã thanh toán)
// Chỉ khi endpoint này được gọi, mới update status SUCCEEDED và gửi message qua RabbitMQ để khóa xe
r.post('/payments/:paymentId/confirm', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId required' });
    }

    const payment = await prepo.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Chỉ xác nhận payment nếu đang ở trạng thái PENDING
    if (payment.status !== PaymentStatus.PENDING) {
      return res.status(409).json({ 
        success: false, 
        message: `Payment already ${payment.status}. Cannot confirm.` 
      });
    }

    // Chỉ xác nhận payment CASH
    if (payment.method !== PaymentMethod.CASH) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only CASH payments can be confirmed via this endpoint' 
      });
    }

    // Update status thành SUCCEEDED
    const oldStatus = payment.status;
    const updatedPayment = await prepo.updateStatus(payment.id, PaymentStatus.SUCCEEDED);
    
    // Tạo transaction log
    await prepo.createTransaction({
      paymentId: payment.id,
      fromStatus: oldStatus,
      toStatus: PaymentStatus.SUCCEEDED,
      amount: payment.amount,
      actorId: null,
      meta: { kind: 'CASH_PAYMENT_CONFIRMED', message: 'Cash payment confirmed and succeeded', method: 'CASH' }
    });

    // CHỈ KHI NÀY mới gửi message qua RabbitMQ để booking service khóa xe
    // KHÔNG gọi API trực tiếp - chỉ dùng RabbitMQ
    try {
      // Gửi message qua RabbitMQ để booking service nhận và khóa xe
      await publishPaymentSucceeded({ 
        bookingId: updatedPayment.bookingId, 
        paymentId: updatedPayment.id, 
        amount: updatedPayment.amount 
      });
      
      console.log(`[PUBLIC] ✓ Payment ${updatedPayment.id} confirmed, RabbitMQ message sent for booking ${updatedPayment.bookingId}. Vehicle will be locked by booking service.`);
    } catch (error) {
      // Log error nhưng không throw - payment đã được confirm
      console.error(`[PUBLIC] ✗ Failed to send RabbitMQ message for payment ${updatedPayment.id}:`, error.message);
      console.error(`[PUBLIC] Error stack:`, error.stack);
    }

    return res.json({ 
      success: true, 
      data: { 
        paymentId: updatedPayment.id, 
        status: updatedPayment.status,
        method: updatedPayment.method,
        message: 'Payment confirmed successfully. Vehicle will be locked.'
      } 
    });
  } catch (e) {
    next(e);
  }
});

export default r;


