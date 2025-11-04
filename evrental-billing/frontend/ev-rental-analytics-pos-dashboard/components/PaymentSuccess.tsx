import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Booking } from '../types';
import type { Page } from '../App';

interface PaymentSuccessProps {
  setCurrentPage: (page: Page) => void;
}

// Re-using the same mock data for consistency in the demo
const mockBooking: Booking = {
  id: 'bk_xyz789',
  renterId: 'rent_123',
  carModel: 'Vinfast VF e34',
  carImageUrl: 'https://img1.oto.com.vn/2021/03/25/32g1b7Sg/vf-e34-mau-trang-d10e.jpg',
  pickupStation: 'S001 - Vincom Center',
  dropoffStation: 'S001 - Vincom Center',
  pickupTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  dropoffTime: new Date(Date.now() + 86400000 * 3).toISOString(), // 2 days after tomorrow
  priceDetails: {
    rentalFee: 1200000,
    insurance: 150000,
    total: 1350000,
  },
};

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ setCurrentPage }) => {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your booking has been confirmed. You will receive an email with the details shortly.</p>
        
        <div className="text-left border-t border-b my-6 py-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Booking Summary</h3>
            <div>
              <img src={mockBooking.carImageUrl} alt={mockBooking.carModel} className="w-full h-48 object-cover rounded-lg shadow-md mb-3" />
              <h4 className="text-lg font-bold">{mockBooking.carModel}</h4>
            </div>
             <div className="text-sm space-y-2">
                <p><span className="font-semibold">Booking ID:</span> {mockBooking.id}</p>
                <p><span className="font-semibold">Pickup:</span> {mockBooking.pickupStation} at {formatDate(mockBooking.pickupTime)}</p>
                <p><span className="font-semibold">Drop-off:</span> {mockBooking.dropoffStation} at {formatDate(mockBooking.dropoffTime)}</p>
                <p className="font-bold pt-2 border-t mt-2"><span className="font-semibold">Total Paid:</span> {mockBooking.priceDetails.total.toLocaleString('vi-VN')} VND</p>
             </div>
        </div>
        
        <Button onClick={() => { window.location.href = 'http://localhost:8060/home'; }}>
          Trở về trang chính
        </Button>
      </Card>
    </div>
  );
};

export default PaymentSuccess;