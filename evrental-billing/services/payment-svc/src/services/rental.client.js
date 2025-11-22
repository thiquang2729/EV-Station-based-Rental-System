import axios from 'axios';

const rentalBaseUrl = process.env.SERVICE_RENTAL_BASE_URL || 'http://rental-svc:3002';

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

// Lấy thông tin booking từ rental service
export async function getBookingById(bookingId){
  try {
    // Query tất cả bookings và tìm theo ID (vì rental service không có endpoint GET /bookings/:id)
    const response = await axios.get(`${rentalBaseUrl}/api/v1/bookings`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Response là array, tìm booking theo ID
    if (Array.isArray(response.data)) {
      const booking = response.data.find(b => b.id === bookingId);
      if (booking) {
        return { success: true, data: booking };
      }
    }
    
    return { success: false, error: 'Booking not found' };
  } catch (error) {
    console.error(`Failed to get booking ${bookingId} from rental service:`, error.message);
    return { success: false, error: error.message };
  }
}
