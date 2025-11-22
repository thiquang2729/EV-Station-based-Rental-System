import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasAdminAccess } from '../utils/auth';

const Header = () => {
  const [elevated, setElevated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { currentUser, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = () => {
    // Redirect to auth frontend (Docker port 8060)
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `http://localhost:8060/login?returnUrl=${returnUrl}`;
  };

  const handleRegister = () => {
    // Redirect to auth frontend register page
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `http://localhost:8060/register?returnUrl=${returnUrl}`;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800';
      case 'RENTER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'STAFF':
        return 'Nhân viên';
      case 'RENTER':
        return 'Khách hàng';
      default:
        return role;
    }
  };

  return (
    <header className={`${(elevated || !isHome) ? 'bg-white/90 backdrop-blur border-b border-gray-200/60' : 'bg-transparent'} sticky top-0 z-40`}>
      <div className="max-padd-container h-16 flexBetween">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-black inline-block" />
          <span className="font-bold">Thuexe</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active-link px-2 py-1' : 'px-2 py-1'}>Trang chủ</NavLink>
          <NavLink to="/listing" className={({ isActive }) => isActive ? 'active-link px-2 py-1' : 'px-2 py-1'}>Danh sách xe</NavLink>
          <NavLink to="/my-bookings" className={({ isActive }) => isActive ? 'active-link px-2 py-1' : 'px-2 py-1'}>Đơn hàng của tôi</NavLink>
          {currentUser && hasAdminAccess(currentUser) && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active-link px-2 py-1' : 'px-2 py-1'}>Quản trị</NavLink>
          )}
          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') && (
            <button
              onClick={() => window.location.href = 'http://localhost:8060/admin/default'}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Trở về Admin
            </button>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {(currentUser.fullName || currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900">
                      {currentUser.fullName || currentUser.name || 'User'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(currentUser.role)}`}>
                      {getRoleDisplayName(currentUser.role)}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{currentUser.fullName || currentUser.name || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-1">Email: {currentUser.email || 'N/A'}</p>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${getRoleBadgeColor(currentUser.role)}`}>
                      {getRoleDisplayName(currentUser.role)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={handleLogin} className="btn-outline hidden sm:inline-flex">
                Đăng nhập
              </button>
              <button onClick={handleRegister} className="btn-soild">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
      {/* Vehicle quick list bar removed as requested */}
    </header>
  );
};

export default Header;
