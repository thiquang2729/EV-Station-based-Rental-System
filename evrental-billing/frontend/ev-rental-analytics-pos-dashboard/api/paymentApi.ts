import { Booking, PaymentMethod } from '../types';

interface PaymentIntentResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  data?: {
    paymentId?: string;
    status?: string;
    method?: string;
  };
}

const API_BASE_URL = 'http://localhost:9080/payments'; // Gateway URL (prefix payments)

/**
 * Creates a payment intent by calling the backend API.
 * @param booking - The booking details.
 * @param method - The chosen payment method.
 * @returns A promise that resolves with the payment intent result.
 */
export const createPaymentIntent = async (
  booking: Booking,
  method: 'VNPAY' | 'STATION'
): Promise<PaymentIntentResponse> => {
  try {
    const url = `${API_BASE_URL}/api/v1/public/payments/intents`;
    const body = {
      bookingId: booking.id,
      renterId: booking.renterId,
      stationId: booking.pickupStation, // Assuming pickupStation contains station ID
      amount: booking.priceDetails.total,
      method: method === 'VNPAY' ? PaymentMethod.VNPAY : PaymentMethod.CASH,
      type: 'RENTAL_FEE',
      description: `Rental fee for ${booking.carModel}`
    };
    
    console.log('🔵 [BILLING API CALL]', {
      method: 'POST',
      url: url,
      body: body,
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include', // Gửi cookie để SSO hoạt động
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment intent');
    }

    if (method === 'VNPAY' && data.data?.redirectUrl) {
      return {
        success: true,
        message: 'VNPAY redirect URL created successfully.',
        redirectUrl: data.data.redirectUrl,
        data: data.data,
      };
    } else {
      return {
        success: true,
        message: 'Payment intent created successfully.',
        data: data.data, // Trả về paymentId và các thông tin khác
      };
    }
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
};

/**
 * Xác nhận thanh toán thành công (chỉ dành cho CASH payment)
 * Chỉ khi endpoint này được gọi, mới update status SUCCEEDED và gửi message qua RabbitMQ để khóa xe
 * @param paymentId - ID của payment cần xác nhận
 * @returns A promise that resolves with the confirmation result
 */
export const confirmPayment = async (paymentId: string): Promise<PaymentIntentResponse> => {
  try {
    const url = `${API_BASE_URL}/api/v1/public/payments/${paymentId}/confirm`;
    
    console.log('🔵 [BILLING API CALL]', {
      method: 'POST',
      url: url,
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm payment');
    }

    return {
      success: true,
      message: data.data?.message || 'Payment confirmed successfully.',
      data: data.data,
    };
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    throw error;
  }
};
