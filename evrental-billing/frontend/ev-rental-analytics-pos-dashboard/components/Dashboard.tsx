
import React from 'react';
import Card from './ui/Card';
import RevenueChart from './RevenueChart';
import UtilizationChart from './UtilizationChart';
import StationReport from './StationReport';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold leading-tight text-gray-900">Analytics Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Overview of rental performance and station statistics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
            <RevenueChart />
        </Card>
        <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Utilization</h3>
            <UtilizationChart />
        </Card>
      </div>

       <div className="grid grid-cols-1 gap-6">
         <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Station Report</h3>
            <StationReport />
         </Card>
       </div>
    </div>
  );
};

export default Dashboard;
