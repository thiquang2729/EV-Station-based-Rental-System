import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuthCallback = () => {
      // Lấy token từ URL query params
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      
      if (accessToken) {
        // Lưu token và set user
        login(accessToken, refreshToken);
        
        // Redirect về trang chủ hoặc trang trước đó
        const returnUrl = searchParams.get('returnUrl') || '/';
        navigate(returnUrl, { replace: true });
      } else {
        setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }
    };

    processAuthCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-center text-gray-900">Đăng nhập thất bại</h3>
          <p className="mt-2 text-sm text-center text-gray-600">{error}</p>
          <button
            onClick={() => window.location.href = 'http://localhost:3002/login'}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

