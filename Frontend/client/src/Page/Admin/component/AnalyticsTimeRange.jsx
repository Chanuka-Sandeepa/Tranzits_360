import { FiFilter, FiRefreshCw, FiDownload } from 'react-icons/fi';

const AnalyticsTimeRange = ({ timeRange, setTimeRange, fetchAnalyticsData }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
      <div className="flex space-x-2">
        <div className="flex bg-white rounded-md shadow-sm border border-gray-200">
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === 'week' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'} rounded-l-md transition-colors`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 text-sm font-medium ${timeRange === 'year' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'} rounded-r-md transition-colors`}
          >
            Yearly
          </button>
        </div>
        
        <button 
          onClick={fetchAnalyticsData} 
          className="flex items-center justify-center px-3 py-2 bg-white text-gray-700 rounded-md shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
        
      </div>
    </div>
  );
};

export default AnalyticsTimeRange;