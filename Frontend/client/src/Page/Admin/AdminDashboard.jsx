// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FiHome, FiUsers, FiMap, FiTruck, FiCalendar, 
  FiCreditCard, FiBarChart2, FiLogOut, FiMenu, FiX 
} from 'react-icons/fi';

// Import admin sub-pages
import Overview from './component/Overview.jsx';
import UserManagement from './component/UserManagement.jsx';
import RouteManagement from './component/RouteManagement.jsx';
import VehicleManagement from './component/VehicleManagement.jsx';
import TripManagement from './component/TripManagement.jsx';
import TicketManagement from './component/TicketManagement.jsx';
import AnalyticsDashboard from './component/AnalyticsDashboard.jsx';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [activeVehicles, setActiveVehicles] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Set up axios interceptor for authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch initial dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, routesRes, vehiclesRes, tripsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users'),
        axios.get('http://localhost:5000/api/routes'),
        axios.get('http://localhost:5000/api/vehicles'),
        axios.get('http://localhost:5000/api/trips')
      ]);
      
      // Format dates in the response data
      const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return 'Invalid Date';
          }
          return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (error) {
          console.error('Error formatting date:', error);
          return 'Invalid Date';
        }
      };

      // Format dates in the response data
      const formattedData = {
        users: usersRes.data.data.map(user => ({
          ...user,
          createdAt: formatDate(user.createdAt),
          lastLogin: formatDate(user.lastLogin)
        })),
        routes: routesRes.data.data.map(route => ({
          ...route,
          createdAt: formatDate(route.createdAt)
        })),
        vehicles: vehiclesRes.data.data.map(vehicle => ({
          ...vehicle,
          lastMaintenance: formatDate(vehicle.lastMaintenance)
        })),
        trips: tripsRes.data.data.map(trip => ({
          ...trip,
          startTime: formatDate(trip.startTime)
        }))
      };
      
      setActiveUsers(formattedData.users.length);
      setTotalRoutes(formattedData.routes.length);
      setActiveVehicles(formattedData.vehicles.filter(v => v.status === 'active').length);
      setUpcomingTrips(formattedData.trips.filter(t => 
        t.status === 'scheduled' || t.status === 'in-progress'
      ).length);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard/admin', icon: <FiHome className="text-lg" />, title: 'Overview' },
    { path: '/admin/dashboard/users', icon: <FiUsers className="text-lg" />, title: 'Users' },
    { path: '/admin/dashboard/routes', icon: <FiMap className="text-lg" />, title: 'Routes' },
    { path: '/admin/dashboard/vehicles', icon: <FiTruck className="text-lg" />, title: 'Vehicles' },
    { path: '/admin/dashboard/trips', icon: <FiCalendar className="text-lg" />, title: 'Trips' },
    { path: '/admin/dashboard/tickets', icon: <FiCreditCard className="text-lg" />, title: 'Tickets' },
    { path: '/admin/dashboard/analytics', icon: <FiBarChart2 className="text-lg" />, title: 'Analytics' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
              <FiTruck className="text-white text-xl" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-800">Transit Admin</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-2 py-4">
          <nav className="space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive(item.path) 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>
          
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="mr-3 text-lg" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiMenu className="w-6 h-6" />
                </button>
                <h2 className="ml-2 md:ml-0 text-lg font-medium text-gray-800">
                  {navItems.find(item => isActive(item.path))?.title || 'Dashboard'}
                </h2>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium">A</span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">Admin User</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Routes>
            <Route index element={
              <Overview 
                isLoading={isLoading} 
                stats={{
                  activeUsers, 
                  totalRoutes, 
                  activeVehicles,
                  upcomingTrips
                }} 
              />
            } />
            <Route path="admin" element={
              <Overview 
                isLoading={isLoading} 
                stats={{
                  activeUsers, 
                  totalRoutes, 
                  activeVehicles,
                  upcomingTrips
                }} 
              />
            } />
            <Route path="users" element={<UserManagement />} />
            <Route path="routes" element={<RouteManagement />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
