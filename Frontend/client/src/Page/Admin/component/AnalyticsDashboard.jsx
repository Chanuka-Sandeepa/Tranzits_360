import { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import AnalyticsTimeRange from './AnalyticsTimeRange.jsx';
import AnalyticsFilters from './AnalyticsFilters.jsx';
import AnalyticsTabs from './AnalyticsTabs.jsx';
import DashboardOverview from './DashboardOverview.jsx';
import RouteAnalytics from './RouteAnalytics.jsx';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('week');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    routeId: '',
    driverId: '',
    vehicleType: 'all'
  });

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchAnalyticsData();
    
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [activeTab, timeRange, filters]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      let endpoint = `${API_BASE_URL}/analytics/${activeTab}?timeRange=${timeRange}`;
      
      if (filters.routeId && activeTab === 'routes') endpoint += `&routeId=${filters.routeId}`;
      if (filters.vehicleType !== 'all') endpoint += `&vehicleType=${filters.vehicleType}`;
      
      const response = await axios.get(endpoint, config);
      
      if (response.data.success) {
        if (activeTab === 'dashboard') setDashboardData(response.data.data);
        else if (activeTab === 'routes') setRouteData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access this data.');
      } else {
        setError(err.response?.data?.message || 'Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleFilters = () => {
    setFilterOpen(!filterOpen);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-lg text-gray-700">Loading analytics data...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-red-800">Error Loading Data</h3>
          <p className="mt-1 text-red-700">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview data={dashboardData} timeRange={timeRange} />;
      case 'routes':
        return <RouteAnalytics data={routeData} />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <AnalyticsTimeRange 
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        toggleFilters={toggleFilters}
        filterOpen={filterOpen}
        fetchAnalyticsData={fetchAnalyticsData}
      />
      <AnalyticsFilters 
        filterOpen={filterOpen}
        filters={filters}
        handleFilterChange={handleFilterChange}
        toggleFilters={toggleFilters}
        fetchAnalyticsData={fetchAnalyticsData}
      />
      <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
};

export default AnalyticsDashboard;