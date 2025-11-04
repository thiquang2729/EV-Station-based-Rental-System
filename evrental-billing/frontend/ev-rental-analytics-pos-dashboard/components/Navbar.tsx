import React, { useState, useContext, useRef, useEffect } from 'react';
import type { Page } from '../App';
import { AuthContext, UserRole } from '../contexts/AuthContext';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-blue-100 hover:text-blue-700'
      }`}
    >
      {label}
    </button>
  );
};

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const renderNavItems = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.ADMIN:
        return (
          <>
            <NavItem
              label="Analytics Dashboard"
              isActive={currentPage === 'DASHBOARD'}
              onClick={() => setCurrentPage('DASHBOARD')}
            />
            <NavItem
              label="Station POS"
              isActive={currentPage === 'POS'}
              onClick={() => setCurrentPage('POS')}
            />
          </>
        );
      case UserRole.STAFF:
        return (
          <NavItem
            label="Station POS"
            isActive={currentPage === 'POS'}
            onClick={() => setCurrentPage('POS')}
          />
        );
      case UserRole.RENTER:
         return (
          <NavItem
            label="Online Booking"
            isActive={currentPage === 'BOOKING'}
            onClick={() => setCurrentPage('BOOKING')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">EV-Rental Services</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden sm:flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                {renderNavItems()}
            </nav>

            {currentUser && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">{currentUser.name.charAt(0)}</span>
                  <div className="text-left hidden md:block">
                      <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;