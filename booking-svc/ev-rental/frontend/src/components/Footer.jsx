import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-10 bg-gray-900 text-gray-200">
      <div className="max-padd-container py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white font-semibold mb-3">EV Rental</h4>
          <p className="text-sm text-gray-400">
            Thuê xe điện nhanh chóng, an toàn, hỗ trợ 24/7. Kết nối các trạm và đội xe trên cùng một nền tảng.
          </p>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">Điều hướng</h5>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><NavLink to="/" className="hover:text-white">Trang chủ</NavLink></li>
            <li><NavLink to="/listing" className="hover:text-white">Danh sách xe</NavLink></li>
            <li><NavLink to="/my-bookings" className="hover:text-white">Đơn của tôi</NavLink></li>
            <li><NavLink to="/contact" className="hover:text-white">Liên hệ</NavLink></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">Thông tin</h5>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Email: support@evrental.dev</li>
            <li>Hotline: 1900 9999</li>
            <li>Giờ làm việc: 08:00 - 22:00</li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3">Kết nối</h5>
          <div className="flex gap-3 text-sm">
            <a className="p-2 rounded bg-gray-800 hover:bg-gray-700 inline-flex" href="https://www.facebook.com/hoang.anh.447742" target="_blank" rel="noreferrer" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.99 3.66 9.13 8.45 9.93v-7.03H7.9v-2.9h2.41V9.85c0-2.38 1.42-3.7 3.59-3.7 1.04 0 2.13.19 2.13.19v2.35h-1.2c-1.18 0-1.54.73-1.54 1.48v1.77h2.63l-.42 2.9h-2.21V22c4.79-.8 8.45-4.94 8.45-9.93Z"/>
              </svg>
            </a>
            <a className="p-2 rounded bg-gray-800 hover:bg-gray-700 inline-flex" href="https://www.instagram.com/ng.h.anh21/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7Zm11 1.25a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0ZM12 8.5A3.5 3.5 0 1 1 8.5 12A3.5 3.5 0 0 1 12 8.5Zm0-2a5.5 5.5 0 1 0 5.5 5.5A5.5 5.5 0 0 0 12 6.5Z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="max-padd-container py-4 text-xs text-gray-500 flex justify-between items-center">
          <span>© {new Date().getFullYear()} EV Rental. All rights reserved.</span>
          <span className="text-gray-400">Made with ❤️ for EV journeys</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
