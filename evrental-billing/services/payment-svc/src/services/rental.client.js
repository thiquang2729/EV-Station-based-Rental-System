import axios from 'axios';

const rentalBaseUrl = process.env.SERVICE_RENTAL_BASE_URL || 'http://rental-svc:8081';

export async function markBookingPaid(bookingId, paymentId){
  try {
    const response = await axios.post(`${rentalBaseUrl}/api/v1/bookings/${bookingId}/mark-paid`, {
      paymentId,
      timestamp: new Date().toISOString()
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    // Log error but don't throw - payment is still valid
    console.error(`Failed to notify rental service for booking ${bookingId}:`, error.message);
    return { success: false, error: error.message };
  }
}
