import { FiUsers, FiCalendar, FiTruck, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

const AnalyticsStatsCards = ({ stats, timeRange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        icon={<FiUsers className="text-indigo-600 text-xl" />}
        title="Total Passengers"
        value={stats.totalPassengers.toLocaleString()}
        growth={stats.passengerGrowth}
        timeRange={timeRange}
        bgColor="bg-indigo-100"
      />
      
      <StatCard 
        icon={<FiCalendar className="text-green-600 text-xl" />}
        title="Active Trips"
        value={stats.activeTrips}
        growth={stats.tripGrowth}
        timeRange={timeRange}
        bgColor="bg-green-100"
      />
      
      <StatCard 
        icon={<FiTruck className="text-amber-600 text-xl" />}
        title="Active Vehicles"
        value={stats.activeVehicles}
        growth={stats.vehicleGrowth}
        timeRange={timeRange}
        bgColor="bg-amber-100"
      />
      
      <StatCard 
        icon={<FiDollarSign className="text-red-600 text-xl" />}
        title="Revenue"
        value={`$${stats.revenue.toLocaleString()}`}
        growth={stats.revenueGrowth}
        timeRange={timeRange}
        bgColor="bg-red-100"
      />
    </div>
  );
};

const StatCard = ({ icon, title, value, growth, timeRange, bgColor }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
    <div className="flex items-center">
      <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-green-600 flex items-center">
          <FiTrendingUp className="mr-1" />
          +{growth}% from last {timeRange}
        </p>
      </div>
    </div>
  </div>
);

export default AnalyticsStatsCards;