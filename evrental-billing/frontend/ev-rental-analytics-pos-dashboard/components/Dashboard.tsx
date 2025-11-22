
import React from 'react';
import Card from './ui/Card';
import RevenueChart from './RevenueChart';
import UtilizationChart from './UtilizationChart';
import StationReport from './StationReport';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Bảng Điều Khiển Phân Tích</h2>
        <p className="mt-1 text-sm text-gray-500">Tổng quan hiệu suất thuê xe và thống kê trạm.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tổng Quan Doanh Thu</h3>
            <RevenueChart />
        </Card>
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mức Độ Sử Dụng Xe</h3>
            <UtilizationChart />
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6">
         <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Báo Cáo Trạm Theo Ngày</h3>
            <StationReport />
         </Card>
       </div>
    </div>
  );
};

export default Dashboard;
