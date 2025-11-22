import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { listBookings, listStations } from '../api/rental';
import { listFleetVehicles } from '../api/fleet';

const MyBookings = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState({});
  const [stations, setStations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchData();
  }, [currentUser, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookingsRes, vehiclesRes, stationsRes] = await Promise.all([
        listBookings(),
        listFleetVehicles(),
        listStations(),
      ]);

      const bookingsData = bookingsRes?.data ?? bookingsRes;
      const vehiclesData = vehiclesRes?.data ?? vehiclesRes;
      const stationsData = stationsRes?.data ?? stationsRes;

      // Create maps for quick lookup
      const vehicleMap = {};
      (Array.isArray(vehiclesData) ? vehiclesData : []).forEach((v) => {
        vehicleMap[v.id] = v;
      });

      const stationMap = {};
      (Array.isArray(stationsData) ? stationsData : []).forEach((s) => {
        stationMap[s.id] = s;
      });

      setVehicles(vehicleMap);
      setStations(stationMap);

      // Filter bookings for current user
      const allBookings = Array.isArray(bookingsData) ? bookingsData : [];
      const userBookings = allBookings.filter(
        (b) => String(b.userId) === String(currentUser?.id || currentUser?.email || 'dev-user')
      );

      setBookings(userBookings);
    } catch (e) {
      setError(e.message || 'Không thể tải danh sách đơn thuê');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-700';
      case 'RETURNED':
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Đang thuê';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'RETURNED':
        return 'Đã trả';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'PENDING':
        return 'Chờ xác nhận';
      default:
        return status || 'Không rõ';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 đ';
    return `${Number(amount).toLocaleString('vi-VN')} đ`;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} ngày ${diffHours > 0 ? `${diffHours} giờ` : ''}`;
    }
    return `${diffHours} giờ`;
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') {
      return ['ACTIVE', 'CONFIRMED', 'PENDING'].includes(booking.status?.toUpperCase());
    }
    if (filterStatus === 'COMPLETED') {
      return ['RETURNED', 'COMPLETED'].includes(booking.status?.toUpperCase());
    }
    if (filterStatus === 'CANCELLED') {
      return booking.status?.toUpperCase() === 'CANCELLED';
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="max-padd-container py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-padd-container py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">Có lỗi xảy ra</p>
          <p className="text-red-500">{error}</p>
          <button onClick={fetchData} className="btn-outline mt-4">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-padd-container py-10">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Đơn thuê xe của tôi</h2>
        <p className="text-gray-600">Quản lý và theo dõi các đơn thuê xe của bạn</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'ALL', label: 'Tất cả', count: bookings.length },
          {
            key: 'ACTIVE',
            label: 'Đang thuê',
            count: bookings.filter((b) =>
              ['ACTIVE', 'CONFIRMED', 'PENDING'].includes(b.status?.toUpperCase())
            ).length,
          },
          {
            key: 'COMPLETED',
            label: 'Hoàn thành',
            count: bookings.filter((b) =>
              ['RETURNED', 'COMPLETED'].includes(b.status?.toUpperCase())
            ).length,
          },
          {
            key: 'CANCELLED',
            label: 'Đã hủy',
            count: bookings.filter((b) => b.status?.toUpperCase() === 'CANCELLED').length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterStatus === tab.key
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-opacity-20 bg-current">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">Chưa có đơn thuê nào</h3>
          <p className="text-gray-600 mb-6">
            {filterStatus === 'ALL'
              ? 'Bạn chưa có đơn thuê xe nào. Hãy bắt đầu thuê xe ngay!'
              : `Không có đơn thuê nào ở trạng thái "${
                  filterStatus === 'ACTIVE'
                    ? 'Đang thuê'
                    : filterStatus === 'COMPLETED'
                    ? 'Hoàn thành'
                    : 'Đã hủy'
                }"`}
          </p>
          <button onClick={() => navigate('/vehicles')} className="btn-soild">
            Xem danh sách xe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => {
            const vehicle = vehicles[booking.vehicleId] || {};
            const station = stations[booking.stationId] || {};

            return (
              <div
                key={booking.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Vehicle Image */}
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {vehicle.imageUrl ? (
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.name || booking.vehicleId}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-5xl">🚗</div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusText(booking.status)}
                    </span>
                    <span className="text-xs text-gray-500">#{booking.id}</span>
                  </div>

                  {/* Vehicle Info */}
                  <div>
                    <h3 className="font-bold text-lg mb-1">
                      {vehicle.name || `Xe ${booking.vehicleId}`}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {vehicle.type || 'Xe điện'} {vehicle.plate ? `• ${vehicle.plate}` : ''}
                    </p>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">📍 Trạm:</span>
                      <span className="font-medium">{station.name || `Trạm ${booking.stationId}`}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">🕐 Bắt đầu:</span>
                      <span className="font-medium">{formatDate(booking.startTime)}</span>
                    </div>
                    {booking.endTime && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-24 flex-shrink-0">🕑 Kết thúc:</span>
                        <span className="font-medium">{formatDate(booking.endTime)}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 w-24 flex-shrink-0">⏱️ Thời lượng:</span>
                      <span className="font-medium">
                        {calculateDuration(booking.startTime, booking.endTime)}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  {vehicle.pricePerDay && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Giá thuê:</span>
                        <span className="font-bold text-lg text-emerald-600">
                          {formatCurrency(vehicle.pricePerDay)}/ngày
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/vehicles/${booking.vehicleId}`)}
                      className="flex-1 btn-outline text-sm py-2"
                    >
                      Xem xe
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;