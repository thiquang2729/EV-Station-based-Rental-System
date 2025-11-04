import React, { useState } from 'react';
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
  const url = new URL(window.location.href);
  const val = url.searchParams.get(name);
  return val;
}

const qBookingId = getQueryParam('bookingId') || 'bk_unknown';
const qAmount = Number(getQueryParam('amount') || 0) || 0;

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

type PaymentStatus = 'idle' | 'loading' | 'succeeded' | 'failed' | 'redirecting';

interface PaymentState {
    status: PaymentStatus;
    error: string | null;
    vnpayUrl: string | null;
}

const BookingPage: React.FC<BookingPageProps> = ({ setCurrentPage }) => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    error: null,
    vnpayUrl: null,
  });
  
  const handlePayAtStation = async () => {
    setPaymentState({ status: 'loading', error: null, vnpayUrl: null });
    try {
      await createPaymentIntent(defaultBooking, 'STATION');
      setPaymentState({ status: 'succeeded', error: null, vnpayUrl: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setPaymentState({ status: 'failed', error: errorMessage, vnpayUrl: null });
    }
  };

  const handlePayWithVnpay = async () => {
    setPaymentState({ status: 'loading', error: null, vnpayUrl: null });
    try {
      const resp = await fetch('http://localhost:9080/payment/api/v1/public/payments/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: defaultBooking.id, amount: defaultBooking.priceDetails.total })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to create public intent');
      const redirectUrl = data?.data?.redirectUrl;
      if (!redirectUrl) throw new Error('VNPAY redirect URL was not provided.');
      setPaymentState({ status: 'redirecting', error: null, vnpayUrl: redirectUrl });
      // Optionally auto redirect:
      window.location.href = redirectUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setPaymentState({ status: 'failed', error: errorMessage, vnpayUrl: null });
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderPaymentButtons = () => {
     if (paymentState.status === 'succeeded') {
        return (
            <div className="text-center p-4 bg-green-100 text-green-800 rounded-lg">
                <h4 className="font-bold">Booking Confirmed!</h4>
                <p className="text-sm">Your booking is successful. Please complete the payment at the station.</p>
            </div>
        );
     }
     
     if (paymentState.status === 'redirecting' && paymentState.vnpayUrl) {
        return (
            <div className="text-center p-4 bg-blue-100 text-blue-800 rounded-lg space-y-3">
                <h4 className="font-bold">Redirecting to VNPAY...</h4>
                <p className="text-sm">Click the button below to go to the VNPAY portal.</p>
                <a
                    href={paymentState.vnpayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Proceed to VNPAY
                </a>
                 <Button onClick={() => setCurrentPage('PAYMENT_SUCCESS')} className="w-full bg-green-600 hover:bg-green-700">
                    I have completed payment
                </Button>
            </div>
        );
     }

     return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Choose Payment Method</h3>
             {paymentState.status === 'failed' && (
                <div className="text-center p-2 bg-red-100 text-red-700 rounded-md text-sm">
                    <p><strong>Payment Failed:</strong> {paymentState.error}</p>
                </div>
            )}
            <Button 
                onClick={handlePayAtStation} 
                className="w-full bg-gray-600 hover:bg-gray-700" 
                disabled={paymentState.status === 'loading'}
            >
                {paymentState.status === 'loading' ? 'Processing...' : 'Pay at Station'}
            </Button>
            <Button 
                onClick={handlePayWithVnpay} 
                className="w-full" 
                disabled={paymentState.status === 'loading'}
            >
                {paymentState.status === 'loading' ? 'Processing...' : 'Pay with VNPAY'}
            </Button>
        </div>
     );
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Booking Confirmation & Payment</h2>
        <p className="mt-1 text-sm text-gray-500">Please review your booking details and choose a payment method.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card className="md:col-span-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Your Itinerary</h3>
          <div className="space-y-4">
            <div>
              <img src={defaultBooking.carImageUrl} alt={defaultBooking.carModel} className="w-full h-48 object-cover rounded-lg shadow-md" />
              <h4 className="text-lg font-bold mt-3">{defaultBooking.carModel}</h4>
            </div>
            <div className="text-sm space-y-2">
              <p><span className="font-semibold">Pickup:</span> {defaultBooking.pickupStation}</p>
              <p><span className="font-semibold">Time:</span> {formatDate(defaultBooking.pickupTime)}</p>
            </div>
            <div className="text-sm space-y-2">
              <p><span className="font-semibold">Drop-off:</span> {defaultBooking.dropoffStation}</p>
              <p><span className="font-semibold">Time:</span> {formatDate(defaultBooking.dropoffTime)}</p>
            </div>
          </div>
        </Card>

        {/* Payment Section */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Price Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Rental Fee (2 days)</span>
                <span>{defaultBooking.priceDetails.rentalFee.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance</span>
                <span>{defaultBooking.priceDetails.insurance.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total</span>
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