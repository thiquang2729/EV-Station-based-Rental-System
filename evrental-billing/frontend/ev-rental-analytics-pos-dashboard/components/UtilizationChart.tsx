
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { PeakHourDataPoint } from '../types';
import { getUtilizationData } from '../api/analyticsApi';

const UtilizationChart: React.FC = () => {
  const [data, setData] = useState<PeakHourDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUtilizationData();
  }, []);

  const loadUtilizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get peak hours for today
      const peakHours = await getUtilizationData();
      
      // Ensure all 24 hours are present, sorted by hour
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const existing = peakHours.find(d => d.hour === i);
        return existing || { hour: i, bookingCount: 0 };
      });
      
      setData(hourlyData);
    } catch (error) {
      console.error('Failed to load utilization data:', error);
      setError('Không tải được dữ liệu mức độ sử dụng');
      
      // Fallback to mock data (all hours with 0 bookings)
      setData(Array.from({ length: 24 }, (_, i) => ({ hour: i, bookingCount: 0 })));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Đang tải dữ liệu mức độ sử dụng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={loadUtilizationData}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
            <BarChart
                data={data}
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
                    label={{ value: 'Số lượng booking', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                    formatter={(value: number) => [`${value} bookings`, 'Số lượng']}
                    labelFormatter={(hour: number) => `Giờ ${hour}:00`}
                />
                <Legend />
                <Bar dataKey="bookingCount" fill="#3b82f6" name="Số lượng booking" />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default UtilizationChart;
