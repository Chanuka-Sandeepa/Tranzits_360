import { Doughnut } from 'react-chartjs-2';

const RouteAnalytics = ({ data }) => {
  if (!data) return <div className="text-center py-8">Loading route data...</div>;
  
  const revenueDistributionData = {
    labels: Object.keys(data.revenueDistribution),
    datasets: [{
      data: Object.values(data.revenueDistribution),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(167, 139, 250, 0.8)',
      ],
      borderWidth: 1,
    }],
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RouteTopRevenueTable routes={data.topRoutesByRevenue} />
        
        <ChartCard title="Revenue Distribution">
          <Doughnut 
            data={revenueDistributionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right' },
                tooltip: {
                  callbacks: {
                    label: context => `${context.label}: ${context.raw}%`
                  }
                }
              },
              cutout: '65%',
              animation: { animateRotate: true, animateScale: true }
            }}
          />
        </ChartCard>
      </div>
    </div>
  );
};

const RouteTopRevenueTable = ({ routes }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
    <h3 className="text-lg font-medium text-gray-800 mb-4">Top Routes by Revenue</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {routes.map(route => (
            <tr key={route.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{route.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${route.revenue.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
    <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
    <div className="h-80">
      {children}
    </div>
  </div>
);

export default RouteAnalytics;