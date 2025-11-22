import React, { useEffect, useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Booking } from '../types';
import type { Page } from '../App';

interface PaymentSuccessProps {
  setCurrentPage: (page: Page) => void;
}

// Helper function để lấy query params từ URL
function getQueryParam(name: string): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  } catch {
    return null;
  }
}

// Fallback mock data nếu không có thông tin từ URL
const defaultMockBooking: Booking = {
  id: 'bk_xyz789',
  renterId: 'rent_123',
  carModel: 'EV Rental',
  carImageUrl: 'https://via.placeholder.com/600x320?text=EV+Rental',
  pickupStation: 'S001',
  dropoffStation: 'S001',
  pickupTime: new Date().toISOString(),
  dropoffTime: new Date(Date.now() + 86400000).toISOString(),
  priceDetails: {
    rentalFee: 0,
    insurance: 0,
    total: 0,
  },
};

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setCurrentPage }) => {
  const [booking, setBooking] = useState<Booking>(defaultMockBooking);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    // Lấy thông tin từ URL params
    const bookingId = getQueryParam('bookingId');
    const amount = getQueryParam('amount');
    const pid = getQueryParam('paymentId');
    
    if (pid) {
      setPaymentId(pid);
    }

    // Tạo booking object từ URL params
    if (bookingId) {
      const bookingData: Booking = {
        id: bookingId,
        renterId: getQueryParam('renterId') || 'rent_123',
        carModel: getQueryParam('carModel') || 'EV Rental',
        carImageUrl: 'https://via.placeholder.com/600x320?text=EV+Rental',
        pickupStation: getQueryParam('pickupStation') || 'S001',
        dropoffStation: getQueryParam('dropoffStation') || 'S001',
        pickupTime: getQueryParam('pickupTime') || new Date().toISOString(),
        dropoffTime: getQueryParam('dropoffTime') || new Date(Date.now() + 86400000).toISOString(),
        priceDetails: {
          rentalFee: amount ? Number(amount) : 0,
          insurance: 0,
          total: amount ? Number(amount) : 0,
        },
      };
      setBooking(bookingData);
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <div className="flex justify-center mb-4">
          <svg className="h-16 w-16 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh Toán Thành Công!</h2>
        <p className="text-gray-600 mb-6">Đơn đặt xe của bạn đã được xác nhận. Bạn sẽ nhận được email với chi tiết trong thời gian ngắn.</p>
        
        <div className="text-left border-t border-b my-6 py-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Tóm Tắt Đặt Xe</h3>
            <div>
              <img src={booking.carImageUrl} alt={booking.carModel} className="w-full h-48 object-cover rounded-lg shadow-md mb-3" />
              <h4 className="text-lg font-bold">{booking.carModel}</h4>
            </div>
             <div className="text-sm space-y-2">
                <p><span className="font-semibold">Mã Đặt Xe:</span> {booking.id}</p>
                {paymentId && <p><span className="font-semibold">Mã Thanh Toán:</span> {paymentId}</p>}
                <p><span className="font-semibold">Nhận Xe:</span> {booking.pickupStation} lúc {formatDate(booking.pickupTime)}</p>
                <p><span className="font-semibold">Trả Xe:</span> {booking.dropoffStation} lúc {formatDate(booking.dropoffTime)}</p>
                <p className="font-bold pt-2 border-t mt-2"><span className="font-semibold">Tổng Đã Thanh Toán:</span> {booking.priceDetails.total.toLocaleString('vi-VN')} VND</p>
             </div>
        </div>
        
        <div className="space-y-3">
          <Button onClick={() => { window.location.href = 'http://localhost:8060/home'; }} className="w-full">
            Trở về trang chính
          </Button>
          <Button onClick={() => setCurrentPage('BOOKING')} className="w-full bg-gray-600 hover:bg-gray-700">
            Xem lại đơn đặt
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;