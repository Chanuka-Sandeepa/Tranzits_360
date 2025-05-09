import { FiUsers, FiCalendar, FiTruck, FiDollarSign, FiTrendingUp, FiDownload } from 'react-icons/fi';
import AnalyticsStatsCards from './AnalyticsStatsCards';
import AnalyticsCharts from './AnalyticsCharts';

const DashboardOverview = ({ data, timeRange }) => {
  const stats = data?.stats || {
    totalPassengers: 0,
    passengerGrowth: 0,
    activeTrips: 0,
    tripGrowth: 0,
    activeVehicles: 0,
    vehicleGrowth: 0,
    revenue: 0,
    revenueGrowth: 0
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Convert to local timezone
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      return localDate.toLocaleString(undefined, options);
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid Date';
    }
  };

  const exportDashboardToCSV = () => {
    try {
      // Prepare CSV header
      let csv = 'Metric,Current Value,Growth Rate\n';
      
      // Add statistics data
      csv += `Total Passengers,${stats.totalPassengers},${stats.passengerGrowth}%\n`;
      csv += `Active Trips,${stats.activeTrips},${stats.tripGrowth}%\n`;
      csv += `Active Vehicles,${stats.activeVehicles},${stats.vehicleGrowth}%\n`;
      csv += `Revenue,$${stats.revenue.toFixed(2)},${stats.revenueGrowth}%\n`;
      
      // Add ticket sales data if available
      if (data?.ticketSales?.length > 0) {
        csv += '\nTicket Sales Data\n';
        csv += 'Date,Amount\n';
        data.ticketSales.forEach(sale => {
          csv += `${formatDate(sale.date)},$${sale.amount.toFixed(2)}\n`;
        });
      }
      
      // Add rider counts data if available
      if (data?.riderCounts?.length > 0) {
        csv += '\nRider Counts Data\n';
        csv += 'Date,Count\n';
        data.riderCounts.forEach(count => {
          csv += `${formatDate(count.date)},${count.count}\n`;
        });
      }

      // Add scheduled trips if available
      if (data?.scheduledTrips?.length > 0) {
        csv += '\nScheduled Trips\n';
        csv += 'Route,Vehicle,Driver,Departure Time,Status\n';
        data.scheduledTrips.forEach(trip => {
          csv += `"${trip.route?.name || 'Unknown Route'}",`;
          csv += `"${trip.vehicle?.model || trip.vehicle?.vehicleType || 'Unknown Vehicle'}",`;
          csv += `"${trip.driver?.name || trip.driver?.firstName || 'Unassigned'}",`;
          csv += `"${formatDate(trip.startTime)}",`;
          csv += `"${trip.status || 'Unknown'}"\n`;
        });
      }
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
        <button 
          onClick={exportDashboardToCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiDownload className="-ml-1 mr-2 h-5 w-5" />
          Export Report
        </button>
      </div>
      <AnalyticsStatsCards stats={stats} timeRange={timeRange} />
      <AnalyticsCharts 
        timeRange={timeRange} 
        ticketSalesData={data?.ticketSales} 
        riderCountsData={data?.riderCounts}
      />
    </div>
  );
};

export default DashboardOverview;