import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasAdminAccess } from '../utils/auth';

/**
 * Component to protect admin routes
 * Redirects to home page if user is not admin
 */
const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  // Redirect to home if not logged in
  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  // Redirect to home if user is not admin
  if (!hasAdminAccess(currentUser)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname, reason: 'unauthorized' }}
      />
    );
  }

  // User is admin, render the protected content
  return children;
};

export default RequireAdmin;
