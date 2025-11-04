
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { UtilizationDataPoint } from '../types';
import { getUtilizationData } from '../api/analyticsApi';

const COLORS = ['#3b82f6', '#d1d5db'];

const UtilizationChart: React.FC = () => {
  const [data, setData] = useState<UtilizationDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUtilizationData();
  }, []);

  const loadUtilizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get last 7 days
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      
      const utilizationData = await getUtilizationData(
        undefined, // stationId - get all stations
        from.toISOString().split('T')[0],
        to.toISOString().split('T')[0]
      );
      
      setData(utilizationData);
    } catch (error) {
      console.error('Failed to load utilization data:', error);
      setError('Failed to load utilization data');
      
      // Fallback to mock data
      setData([
        { name: 'In Use', value: 75 },
        { name: 'Available', value: 25 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading utilization data...</p>
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
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <PieChart>
                <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                 <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-gray-700"
                >
                    {data.length > 0 ? `${data[0].value}%` : '0%'}
                </text>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Utilization']}/>
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
};

export default UtilizationChart;
