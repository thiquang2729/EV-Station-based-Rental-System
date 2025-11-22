import React, { useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';

const AUTH_FRONTEND_URL = 'http://localhost:8060'; // Auth UI (Docker)

const Login: React.FC = () => {
  // Redirect đến centralized auth frontend để đăng nhập (SSO)
  const handleRedirectToLogin = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_FRONTEND_URL}/login?returnUrl=${returnUrl}`;
  };

  // Tự động redirect sau 2 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRedirectToLogin();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome to EV-Rental</h2>
        <p className="text-gray-500 mb-6 text-center">Đang chuyển đến trang đăng nhập...</p>
        
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        
        <Button 
          onClick={handleRedirectToLogin}
          className="w-full"
        >
          Đăng nhập ngay
        </Button>
      </Card>
    </div>
  );
};

export default Login;
