
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { RentalHourDataPoint } from '../types';
import { getRentalHoursByDate } from '../api/analyticsApi';
import Input from './ui/Input';

const StationReport: React.FC = () => {
  const [reportData, setReportData] = useState<RentalHourDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStationReports();
  }, [selectedDate]);

  const loadStationReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get rental hours for selected date
      const rentalHours = await getRentalHoursByDate(selectedDate);
      
      // Ensure all 24 hours are present, sorted by hour
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const existing = rentalHours.find(d => d.hour === i);
        return existing || { hour: i, rentalHours: 0, bookingCount: 0 };
      });
      
      setReportData(hourlyData);
    } catch (error) {
      console.error('Failed to load station reports:', error);
      setError('Failed to load station reports');
      
      // Fallback to mock data
      const mockData: RentalHourDataPoint[] = [];
      for (let hour = 0; hour < 24; hour++) {
        mockData.push({ 
          hour, 
          rentalHours: Math.floor(Math.random() * 50),
          bookingCount: Math.floor(Math.random() * 10) 
        });
      }
      setReportData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleLoadData = () => {
    loadStationReports();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading rental hours data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadStationReports} className="text-sm underline">Thử lại</button>
        </div>
      )}

      <div className="mb-4 flex gap-4 items-end">
        <Input
          label="Chọn ngày"
          id="rental-date"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
        />
        <button
          onClick={handleLoadData}
          className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Tải dữ liệu
        </button>
      </div>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={reportData}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 12 }} 
              label={{ value: 'Giờ trong ngày', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Số giờ thuê', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'rentalHours') return [`${value.toFixed(1)} giờ`, 'Tổng giờ thuê'];
                if (name === 'bookingCount') return [`${value} bookings`, 'Số lượng'];
                return [value, name];
              }}
              labelFormatter={(hour: number) => `Giờ ${hour}:00`}
            />
            <Legend />
            <Bar dataKey="rentalHours" fill="#3b82f6" name="Tổng giờ thuê" />
            <Bar dataKey="bookingCount" fill="#10b981" name="Số lượng booking" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StationReport;
