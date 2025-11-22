
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { RevenueDataPoint } from '../types';
import { getRevenueData, getRevenueDaily } from '../api/analyticsApi';
import Input from './ui/Input';

const RevenueChart: React.FC = () => {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTotal, setSelectedTotal] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const formatDate = (isoOrDate: string | Date) => {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }); // dd/MM
  };

  const loadRevenueData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get last 7 days
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);

      // Use revenue-daily aggregated endpoint
      const daily = await getRevenueDaily(
        from.toISOString().split('T')[0],
        to.toISOString().split('T')[0]
      );

      console.log('[RevenueChart] Loaded daily data:', daily);

      // Fill missing dates with 0 revenue
      const allDates: string[] = [];
      const currentDate = new Date(from);
      while (currentDate <= to) {
        allDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create a map of existing data
      const dataMap = new Map(daily.map(d => [d.date, d.total]));

      // Map to chart points, filling missing dates with 0
      const points = allDates.map(date => ({
        name: formatDate(date),
        revenue: dataMap.get(date) || 0
      })) as RevenueDataPoint[];

      setData(points);
      setFromDate(from.toISOString().split('T')[0]);
      setToDate(to.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
      setError('Không tải được dữ liệu doanh thu');
      
      // Fallback to mock data
      setData([
        { name: 'Mon', revenue: 4000000 },
        { name: 'Tue', revenue: 3000000 },
        { name: 'Wed', revenue: 2000000 },
        { name: 'Thu', revenue: 2780000 },
        { name: 'Fri', revenue: 1890000 },
        { name: 'Sat', revenue: 2390000 },
        { name: 'Sun', revenue: 3490000 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRange = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const daily = await getRevenueDaily(fromDate, toDate);
      console.log('[RevenueChart] Loaded range data:', daily);

      // Fill missing dates with 0 revenue
      const allDates: string[] = [];
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const currentDate = new Date(from);
      while (currentDate <= to) {
        allDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create a map of existing data
      const dataMap = new Map(daily.map(d => [d.date, d.total]));

      // Map to chart points, filling missing dates with 0
      const points = allDates.map(date => ({
        name: formatDate(date),
        revenue: dataMap.get(date) || 0
      })) as RevenueDataPoint[];

      setData(points);
    } catch (e) {
      console.error('Failed to load range:', e);
      setError('Không tải được dữ liệu khoảng ngày');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSelectedDateTotal = async (dateStr: string) => {
    try {
      setError(null);
      setSelectedTotal(null);
      const rows = await getRevenueDaily(dateStr, dateStr);
      console.log('[RevenueChart] Loaded data for date:', dateStr, 'Rows:', rows);
      // Tìm row có date khớp với dateStr
      const row = Array.isArray(rows) ? rows.find(r => r.date === dateStr) : null;
      const total = row ? Number(row.total || 0) : 0;
      setSelectedTotal(total);
    } catch (e) {
      console.error('Failed to load revenue daily:', e);
      setError('Không tải được dữ liệu doanh thu');
      // Graceful fallback: show 0 thay vì lỗi
      setSelectedTotal(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Đang tải dữ liệu doanh thu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadRevenueData} className="text-sm underline">Thử lại</button>
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <Input
          label="Từ ngày"
          id="from-date"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          label="Đến ngày"
          id="to-date"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <button
          onClick={loadRange}
          className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Tải dữ liệu
        </button>
        <Input
          label="Chọn ngày"
          id="revenue-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button
          onClick={() => loadSelectedDateTotal(selectedDate)}
          className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Xem tổng doanh thu ngày
        </button>
        <div className="text-right md:col-span-5">
          <div className="text-sm text-gray-500">Tổng doanh thu ngày đã chọn</div>
          <div className="text-2xl font-semibold">{selectedTotal !== null ? selectedTotal.toLocaleString('vi-VN') + ' VND' : '-'}</div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
        <BarChart
            data={data}
            margin={{
            top: 5,
            right: 20,
            left: 30,
            bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
            <YAxis 
                tickFormatter={(value: number) => `${(value / 1000000)}M`}
                label={{ value: 'VND', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} VND`, 'Doanh thu']} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu" />
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
