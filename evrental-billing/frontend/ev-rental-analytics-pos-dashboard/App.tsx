import React, { useState, useContext, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Booking from './components/Booking';
import Login from './components/Login';
import PaymentSuccess from './components/PaymentSuccess';
import { AuthProvider, AuthContext, UserRole } from './contexts/AuthContext';

export type Page = 'DASHBOARD' | 'POS' | 'BOOKING' | 'PAYMENT_SUCCESS';

const AppContent: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState<Page>('DASHBOARD');

  useEffect(() => {
    // Set default page on login
    if (currentUser?.role) {
      switch (currentUser.role) {
        case UserRole.ADMIN:
          setCurrentPage('DASHBOARD');
          break;
        case UserRole.STAFF:
          setCurrentPage('POS');
          break;
        case UserRole.RENTER:
          setCurrentPage('BOOKING');
          break;
        default:
          setCurrentPage('DASHBOARD');
      }
    }
  }, [currentUser]);

  const hasBookingParams = (() => {
    try {
      const url = new URL(window.location.href);
      return !!url.searchParams.get('bookingId');
    } catch { return false; }
  })();
  const hasPaymentSuccess = (() => {
    try {
      const url = new URL(window.location.href);
      // Hỗ trợ cả VNPAY (vnp_status) và Cash payment (payment_status)
      return url.searchParams.get('vnp_status') === 'success' || url.searchParams.get('payment_status') === 'success';
    } catch { return false; }
  })();

  useEffect(() => {
    // Nếu thanh toán thành công (VNPAY hoặc Cash), hiển thị trang PaymentSuccess
    try {
      const url = new URL(window.location.href);
      const vnpStatus = url.searchParams.get('vnp_status');
      const paymentStatus = url.searchParams.get('payment_status');
      if (vnpStatus === 'success' || paymentStatus === 'success') {
        setCurrentPage('PAYMENT_SUCCESS');
        return;
      }
    } catch {}
    // Nếu có bookingId trên URL, chuyển thẳng sang trang BOOKING
    if (hasBookingParams) {
      setCurrentPage('BOOKING');
    }
  }, [hasBookingParams]);

  const renderPage = () => {
    if (!currentUser && !(hasBookingParams || hasPaymentSuccess)) {
      return <Login />;
    }

    // Role-based page access control
    switch (currentPage) {
      case 'DASHBOARD':
        return currentUser?.role === UserRole.ADMIN ? <Dashboard /> : <h2>Access Denied</h2>;
      case 'POS':
        return currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.STAFF ? <POS /> : <h2>Access Denied</h2>;
      case 'BOOKING':
        if (hasBookingParams) {
          return <Booking setCurrentPage={setCurrentPage} />;
        }
        return currentUser && currentUser.role === UserRole.RENTER
          ? <Booking setCurrentPage={setCurrentPage} />
          : <h2>Access Denied</h2>;
       case 'PAYMENT_SUCCESS':
        if (hasPaymentSuccess) {
          return <PaymentSuccess setCurrentPage={setCurrentPage} />;
        }
        return currentUser && currentUser.role === UserRole.RENTER ? <PaymentSuccess setCurrentPage={setCurrentPage} /> : <h2>Access Denied</h2>;
      default:
        return <Dashboard />;
    }
  };
  
  if (!currentUser && !(hasBookingParams || hasPaymentSuccess)) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {currentUser && <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      <main className="p-4 sm:p-6 lg:p-8">
        {renderPage()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};


export default App;