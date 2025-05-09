import { useState, useEffect } from 'react';
import axios from 'axios';

const AnalyticsFilters = ({ filterOpen, filters, handleFilterChange, toggleFilters, fetchAnalyticsData }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/routes', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setRoutes(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load routes');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  if (!filterOpen) return null;
  
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6 animate-fadeIn">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Filter Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="routeId" className="block text-sm font-medium text-gray-700">Route</label>
          <select
            id="routeId"
            name="routeId"
            value={filters.routeId}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">All Routes</option>
            {routes.map(route => (
              <option key={route._id} value={route._id}>
                {route.name} (#{route.routeNumber})
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">Vehicle Type</label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={filters.vehicleType}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="bus">Bus</option>
            <option value="minibus">Minibus</option>
            <option value="van">Van</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            handleFilterChange({ target: { name: 'routeId', value: '' } });
            handleFilterChange({ target: { name: 'driverId', value: '' } });
            handleFilterChange({ target: { name: 'vehicleType', value: 'all' } });
          }}
          className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => {
            fetchAnalyticsData();
            toggleFilters();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default AnalyticsFilters;