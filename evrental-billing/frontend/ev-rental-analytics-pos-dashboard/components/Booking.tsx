import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Booking } from '../types';
import type { Page } from '../App';
import { createPaymentIntent } from '../api/paymentApi';

interface BookingPageProps {
  setCurrentPage: (page: Page) => void;
}

// Lấy bookingId và amount từ query để hiển thị đúng đơn cần thanh toán
function getQueryParam(name: string): string | null {
  try {
    const url = new URL(window.location.href);
    const val = url.searchParams.get(name);
    return val;
  } catch (error) {
    console.error('Error parsing query params:', error);
    return null;
  }
}

const qBookingId = getQueryParam('bookingId') || 'bk_unknown';
const qAmount = Number(getQueryParam('amount') || 0) || 0;

console.log('🔵 [BILLING] Booking page loaded with params:', {
  bookingId: qBookingId,
  amount: qAmount,
  fullUrl: window.location.href
});

// Default booking data - thay bằng dữ liệu tối thiểu từ query
const defaultBooking: Booking = {
  id: qBookingId,
  renterId: 'rent_123',
  carModel: 'EV Rental',
  carImageUrl: 'https://via.placeholder.com/600x320?text=EV+Rental',
  pickupStation: 'S001',
  dropoffStation: 'S001',
  pickupTime: new Date().toISOString(),
  dropoffTime: new Date(Date.now() + 86400000).toISOString(),
  priceDetails: {
    rentalFee: qAmount,
    insurance: 0,
    total: qAmount,
  },
};

type PaymentStatus = 'idle' | 'loading' | 'succeeded' | 'failed' | 'redirecting' | 'pending_confirmation';

interface PaymentState {
    status: PaymentStatus;
    error: string | null;
    vnpayUrl: string | null;
    paymentId: string | null; // Lưu paymentId để confirm sau
}

const BookingPage: React.FC<BookingPageProps> = ({ setCurrentPage }) => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    error: null,
    vnpayUrl: null,
    paymentId: null,
  });
  
  const [countdown, setCountdown] = useState(5);
  
  // Countdown và redirect về my-bookings sau 5 giây
  useEffect(() => {
    if (paymentState.status === 'pending_confirmation') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect về booking frontend my-bookings
            window.location.href = 'http://localhost:3004/#/my-bookings';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(5); // Reset countdown khi không ở trạng thái pending
    }
  }, [paymentState.status]);
  
  // Bước 1: Tạo payment intent (PENDING - chưa thanh toán, chưa khóa xe)
  const handlePayAtStation = async () => {
    setPaymentState({ status: 'loading', error: null, vnpayUrl: null, paymentId: null });
    try {
      const result = await createPaymentIntent(defaultBooking, 'STATION');
      // Lưu paymentId để confirm sau
      setPaymentState({ 
        status: 'pending_confirmation', 
        error: null, 
        vnpayUrl: null,
        paymentId: result.data?.paymentId || null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setPaymentState({ status: 'failed', error: errorMessage, vnpayUrl: null, paymentId: null });
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderPaymentButtons = () => {
     // Trạng thái: đã tạo payment intent, chờ staff xác nhận tại POS
     if (paymentState.status === 'pending_confirmation') {
        return (
            <div className="space-y-4">
            <div className="text-center p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex justify-center mb-4">
                      <svg className="h-16 w-16 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-xl text-green-800 mb-3">✓ Đặt xe thành công!</h4>
                    <p className="text-sm mb-2 text-gray-700">Đơn đặt xe của bạn đã được tạo thành công.</p>
                    <div className="bg-white p-4 rounded-lg my-4 border border-green-200">
                      <p className="text-sm font-semibold text-gray-800 mb-2">📍 Hướng dẫn thanh toán:</p>
                      <p className="text-sm text-gray-700">Hãy đến trạm bạn đã đăng ký và xác nhận với nhân viên để hoàn tất thủ tục thuê xe.</p>
                    </div>
                    {paymentState.paymentId && (
                        <p className="text-xs text-gray-500 mt-2">Mã đơn: {paymentState.paymentId}</p>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      Đang chuyển hướng về trang đơn thuê trong <span className="font-bold text-green-600 text-lg">{countdown}</span> giây...
                    </div>
                </div>
                {paymentState.status === 'failed' && (
                    <div className="text-center p-2 bg-red-100 text-red-700 rounded-md text-sm">
                        <p><strong>Lỗi:</strong> {paymentState.error}</p>
            </div>
                )}
                <Button 
                    onClick={() => window.location.href = 'http://localhost:3004/#/my-bookings'} 
                    className="w-full bg-green-600 hover:bg-green-700" 
                >
                    Xem đơn thuê ngay
                </Button>
            </div>
        );
     }

     // Trạng thái mặc định: chọn phương thức thanh toán
     return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Phương thức thanh toán</h3>
             {paymentState.status === 'failed' && (
                <div className="text-center p-2 bg-red-100 text-red-700 rounded-md text-sm">
                    <p><strong>Thanh toán thất bại:</strong> {paymentState.error}</p>
                </div>
            )}
            <Button 
                onClick={handlePayAtStation} 
                className="w-full" 
                disabled={paymentState.status === 'loading'}
            >
                {paymentState.status === 'loading' ? 'Đang xử lý...' : 'Thanh toán tại trạm'}
            </Button>
        </div>
     );
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Xác nhận đặt xe & Thanh toán</h2>
        <p className="mt-1 text-sm text-gray-500">Vui lòng xem lại thông tin đặt xe và chọn phương thức thanh toán.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card className="md:col-span-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin chuyến đi</h3>
          <div className="space-y-4">
            <div>
              <img src={defaultBooking.carImageUrl} alt={defaultBooking.carModel} className="w-full h-48 object-cover rounded-lg shadow-md" />
              <h4 className="text-lg font-bold mt-3">{defaultBooking.carModel}</h4>
            </div>
            <div className="text-sm space-y-2">
              <p><span className="font-semibold">Trạm nhận:</span> {defaultBooking.pickupStation}</p>
              <p><span className="font-semibold">Thời gian:</span> {formatDate(defaultBooking.pickupTime)}</p>
            </div>
            <div className="text-sm space-y-2">
              <p><span className="font-semibold">Trạm trả:</span> {defaultBooking.dropoffStation}</p>
              <p><span className="font-semibold">Thời gian:</span> {formatDate(defaultBooking.dropoffTime)}</p>
            </div>
          </div>
        </Card>

        {/* Payment Section */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Tổng chi phí</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Phí thuê xe</span>
                <span>{defaultBooking.priceDetails.rentalFee.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between">
                <span>Bảo hiểm</span>
                <span>{defaultBooking.priceDetails.insurance.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Tổng cộng</span>
                <span>{defaultBooking.priceDetails.total.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
             {renderPaymentButtons()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingPage;