import { Line } from 'react-chartjs-2';

const AnalyticsCharts = ({ timeRange, ticketSalesData }) => {
  const chartData = formatChartData(timeRange, ticketSalesData);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Ticket Sales">
        <Line 
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { position: 'top' } },
            interaction: { mode: 'nearest', intersect: true, axis: 'x' },
            animations: { tension: { duration: 1000, easing: 'linear' } }
          }}
        />
      </ChartCard>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
    <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

const formatChartData = (timeRange, data) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const recentMonths = months.slice(0, 7);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const getLabels = () => {
    if (timeRange === 'week') return days;
    if (timeRange === 'month') return Array.from({length: 30}, (_, i) => i + 1);
    return recentMonths;
  };

  const getDataPoints = () => {
    if (data?.dataPoints) return data.dataPoints;
    const count = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 7;
    return Array.from({ length: count }, () => Math.floor(Math.random() * 4001) + 1000);
  };

  return {
    labels: getLabels(),
    datasets: [{
      label: 'Ticket Sales',
      data: getDataPoints(),
      borderColor: 'rgba(99, 102, 241, 1)',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      fill: true,
      tension: 0.4,
    }]
  };
};

export default AnalyticsCharts;