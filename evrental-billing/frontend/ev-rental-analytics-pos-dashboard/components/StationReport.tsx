
import React, { useState, useEffect } from 'react';
import type { StationReport } from '../types';
import { getStationReports } from '../api/analyticsApi';

const StationReportTable: React.FC = () => {
  const [reportData, setReportData] = useState<StationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStationReports();
  }, []);

  const loadStationReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get today's report
      const today = new Date().toISOString().split('T')[0];
      const reports = await getStationReports(today);
      
      setReportData(reports);
    } catch (error) {
      console.error('Failed to load station reports:', error);
      setError('Failed to load station reports');
      
      // Fallback to mock data
      setReportData([
        { stationId: 'S001', date: '2023-10-27', revenue: 4250000, rentals: 55, utilization: 0.82, peakHours: [17, 18, 19] },
        { stationId: 'S002', date: '2023-10-27', revenue: 3100000, rentals: 42, utilization: 0.75, peakHours: [8, 17, 18] },
        { stationId: 'S003', date: '2023-10-27', revenue: 2800000, rentals: 38, utilization: 0.71, peakHours: [9, 12, 17] },
        { stationId: 'S004', date: '2023-10-27', revenue: 3500000, rentals: 48, utilization: 0.79, peakHours: [17, 18, 20] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading station reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button 
            onClick={loadStationReports}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue (VND)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rentals</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Hours</th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {reportData.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No station reports found
                    </td>
                </tr>
            ) : (
                reportData.map((report) => (
                <tr key={report.stationId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.stationId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.revenue.toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.rentals}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                           <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${report.utilization * 100}%` }}></div>
                        </div>
                        {(report.utilization * 100).toFixed(0)}%
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-1">
                        {report.peakHours.map(hour => (
                            <span key={hour} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md">{`${hour}:00`}</span>
                        ))}
                    </div>
                </td>
                </tr>
                ))
            )}
            </tbody>
        </table>
    </div>
  );
};

export default StationReportTable;
