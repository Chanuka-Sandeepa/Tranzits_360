import { useEffect, useState } from 'react';
import { FiUsers, FiMap, FiTruck, FiCalendar, FiCreditCard, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';

const StatCard = ({ icon, title, color, linkTo }) => (
  <Link to={linkTo} className="block">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-600">{title}</h3>
        </div>
      </div>
    </div>
  </Link>
);

const ScheduledTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/trips', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        console.log('Trips API Response:', res.data);

        const scheduled = res.data.data.filter((trip) => trip.status === 'scheduled');
        setTrips(scheduled);
      } catch (err) {
        console.error(err);
        setError('Failed to load trips.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Scheduled Trips</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : trips.length > 0 ? (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip._id} className="flex items-start justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {trip.route?.name || 'Unnamed Route'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Vehicle: {trip.vehicle?.name || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-600">
                  {new Date(trip.departureTime).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No scheduled trips at the moment.</p>
      )}
    </div>
  );
};

const Overview = ({ isLoading, stats }) => {
  const { activeUsers, totalRoutes, activeVehicles, upcomingTrips } = stats;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiUsers className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-800">{isLoading ? '...' : activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Routes Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <FiMap className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-semibold text-gray-800">{isLoading ? '...' : totalRoutes}</p>
            </div>
          </div>
        </div>

        {/* Active Vehicles Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiTruck className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-semibold text-gray-800">{isLoading ? '...' : activeVehicles}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Trips Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiCalendar className="text-purple-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
              <p className="text-2xl font-semibold text-gray-800">{isLoading ? '...' : upcomingTrips}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<FiUsers className="text-white text-xl" />}
          title="Users Management"
          color="bg-blue-500"
          linkTo="/admin/dashboard/users"
        />
        <StatCard 
          icon={<FiMap className="text-white text-xl" />}
          title="Routes Management"
          color="bg-green-500"
          linkTo="/admin/dashboard/routes"
        />
        <StatCard 
          icon={<FiTruck className="text-white text-xl" />}
          title="Vehicles Management"
          color="bg-purple-500"
          linkTo="/admin/dashboard/vehicles"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/dashboard/trips" className="flex flex-col items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <FiCalendar className="text-2xl text-indigo-600" />
              <span className="mt-2 text-sm font-medium text-gray-700">Manage Trips</span>
            </Link>
            <Link to="/admin/dashboard/routes" className="flex flex-col items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <FiMap className="text-2xl text-green-600" />
              <span className="mt-2 text-sm font-medium text-gray-700">View Routes</span>
            </Link>
            <Link to="/admin/dashboard/tickets" className="flex flex-col items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <FiCreditCard className="text-2xl text-amber-600" />
              <span className="mt-2 text-sm font-medium text-gray-700">Verify Tickets</span>
            </Link>
            <Link to="/admin/dashboard/analytics" className="flex flex-col items-center bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <FiTrendingUp className="text-2xl text-red-600" />
              <span className="mt-2 text-sm font-medium text-gray-700">View Analytics</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;
