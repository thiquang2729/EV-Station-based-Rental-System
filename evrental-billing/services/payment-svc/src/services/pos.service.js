import { z } from 'zod';
import * as repo from '../repositories/payment.repo.js';
import { PaymentMethod, PaymentType, PaymentStatus } from '../utils/enums.js';
import { publishPaymentSucceeded } from '../mq.js';
import * as rental from './rental.client.js';

const collectSchema = z.object({
  bookingId: z.union([z.string(), z.number()]).transform(String),
  stationId: z.union([z.string(), z.number()]).transform(String),
  amount: z.number().positive(),
  method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD]),
  type: z.nativeEnum(PaymentType),
  description: z.string().optional()
});

// Tạo payment PENDING - chờ staff xác nhận
export async function collectAtPOS(dto, user){
  const input = collectSchema.parse(dto);
  
  // RBAC check
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(!userStationIds.includes(input.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }
  
  // Tạo payment với status PENDING - chờ staff xác nhận
  const paymentData = {
    bookingId: input.bookingId,
    renterId: user.id, // Staff ID hoặc có thể lấy từ booking
    stationId: input.stationId,
    amount: input.amount,
    method: input.method,
    type: input.type,
    description: input.description || `POS payment for booking ${input.bookingId}`,
    status: PaymentStatus.PENDING, // PENDING - chờ staff confirm
    createdBy: user.id
  };
  
  const payment = await repo.createPayment(paymentData);
  await repo.createTransaction({
    paymentId: payment.id,
    fromStatus: null,
    toStatus: PaymentStatus.PENDING,
    amount: payment.amount,
    actorId: user.id,
    meta: { kind: 'POS_PENDING', message: `POS payment created, waiting for confirmation`, method: input.method }
  });
  
  return { success: true, data: payment, message: 'Payment created. Please confirm after collecting payment.' };
}

// Xác nhận payment từ POS - chỉ staff/admin mới được confirm
export async function confirmPOSPayment(paymentId, user){
  const payment = await repo.getPaymentById(paymentId);
  if (!payment) {
    const e = new Error('Payment not found'); e.status = 404; throw e;
  }

  // Chỉ confirm payment PENDING
  if (payment.status !== PaymentStatus.PENDING) {
    const e = new Error(`Payment already ${payment.status}. Cannot confirm.`); e.status = 409; throw e;
  }

  // RBAC check - staff chỉ confirm payment ở station của mình
  if(user.role === 'STAFF'){
    const userStationIds = user.stationIds || [];
    if(!userStationIds.includes(payment.stationId)){
      const e = new Error('FORBIDDEN'); e.status = 403; throw e;
    }
  }

  // Update status thành SUCCEEDED
  const oldStatus = payment.status;
  const updatedPayment = await repo.updateStatus(payment.id, PaymentStatus.SUCCEEDED);
  
  // Tạo transaction log
  await repo.createTransaction({
    paymentId: payment.id,
    fromStatus: oldStatus,
    toStatus: PaymentStatus.SUCCEEDED,
    amount: payment.amount,
    actorId: user.id,
    meta: { kind: 'POS_CONFIRMED', message: `POS payment confirmed by ${user.role}`, method: payment.method }
  });

  // CHỈ gửi message qua RabbitMQ để booking service nhận và khóa xe
  // KHÔNG gọi API trực tiếp - chỉ dùng RabbitMQ
  try {
    await publishPaymentSucceeded({ 
      bookingId: updatedPayment.bookingId, 
      paymentId: updatedPayment.id, 
      amount: updatedPayment.amount 
    });
    console.log(`[POS] ✓ Payment ${updatedPayment.id} confirmed, RabbitMQ message sent for booking ${updatedPayment.bookingId}. Vehicle will be locked by booking service.`);
  } catch (error) {
    console.error(`[POS] ✗ Failed to send RabbitMQ message for payment ${updatedPayment.id}:`, error.message);
    console.error(`[POS] Error stack:`, error.stack);
    // Không throw - payment đã được confirm, nhưng cần kiểm tra RabbitMQ
  }

  return { success: true, data: updatedPayment, message: 'Payment confirmed successfully. Vehicle will be locked.' };
}
