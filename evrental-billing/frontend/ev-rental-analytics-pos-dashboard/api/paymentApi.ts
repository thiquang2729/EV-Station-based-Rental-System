import { Booking, PaymentMethod } from '../types';

interface PaymentIntentResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

const API_BASE_URL = 'http://localhost:9080/payment'; // Gateway URL (prefix payment)

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
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        renterId: booking.renterId,
        stationId: booking.pickupStation, // Assuming pickupStation contains station ID
        amount: booking.priceDetails.total,
        method: method === 'VNPAY' ? PaymentMethod.VNPAY : PaymentMethod.CASH,
        type: 'RENTAL_FEE',
        description: `Rental fee for ${booking.carModel}`
      })
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
      };
    } else {
      return {
        success: true,
        message: 'Payment intent created successfully.',
      };
    }
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
};
