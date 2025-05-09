import { useState, useEffect } from 'react';
import { 
  MapPin, Clock, DollarSign, Users, Search, Filter, ChevronDown, 
  BellRing, User, Trash2, Edit, LogOut, CreditCard, Calendar,
  CheckCircle, XCircle, AlertCircle, ArrowRight, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VehicleTracker from './VehicleTracker';
import VehicleMap from './VehicleMap';

export default function PassengerDashboard() {
  const navigate = useNavigate();
  
  // State for profile and authentication
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    homeAddress: '',
    workAddress: ''
  });
  
  // State for tickets and vehicles
  const [tickets, setTickets] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    routeId: '',
    ticketType: 'single',
    fareCategory: 'regular',
    paymentMethod: 'credit'
  });
  
  // Setup axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      navigate('/login');
    }
    
    fetchUserData();
    fetchMyTickets();
    fetchVehicles();
    fetchRoutes();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setUser(response.data.user);
      
      // Initialize profile form with user data
      setProfileForm({
        firstName: response.data.user.firstName || '',
        lastName: response.data.user.lastName || '',
        phone: response.data.user.phone || '',
        homeAddress: response.data.user.homeAddress?.address || '',
        workAddress: response.data.user.workAddress?.address || ''
      });
    } catch (err) {
      setError('Failed to load profile. Please try again.');
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMyTickets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tickets/my-tickets');
      setTickets(response.data.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };
  
  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vehicles');
      // Add sample location data for testing
      const vehiclesWithLocation = response.data.data.map(vehicle => ({
        ...vehicle,
        currentLocation: {
          coordinates: [
            // Colombo area coordinates (longitude, latitude)
            79.8612 + (Math.random() * 0.1 - 0.05), // Random longitude around Colombo
            6.9271 + (Math.random() * 0.1 - 0.05)   // Random latitude around Colombo
          ]
        }
      }));
      setVehicles(vehiclesWithLocation);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };
  
  const fetchRoutes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/routes');
      setRoutes(response.data.data);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };
  
  // Handle profile form submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.put('http://localhost:5000/api/auth/update-profile', {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phone: profileForm.phone,
        homeAddress: profileForm.homeAddress,
        workAddress: profileForm.workAddress
      });
      
      setUser(response.data.user);
      setSuccess('Profile updated successfully!');
      
      // Update local storage if needed
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        ...response.data.user
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    }
  };
  
  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete('http://localhost:5000/api/auth/delete');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      console.error('Error deleting account:', err);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // Handle booking form changes
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm({
      ...bookingForm,
      [name]: value
    });
  };
  
  
  // Handle route selection 
  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    setBookingForm({
      ...bookingForm,
      routeId: route._id
    });
  };
  
  // Handle vehicle selection and show booking modal
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowBookingModal(true);
  };
  
  // Handle ticket booking
  const handleBookTicket = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:5000/api/tickets', bookingForm);
      
      setSuccess('Ticket booked successfully!');
      setShowBookingModal(false);
      
      // Update tickets with the new ticket
      setTickets(prevTickets => [...prevTickets, response.data.data]);
      
      // Reset form
      setBookingForm({
        routeId: '',
        ticketType: 'single',
        fareCategory: 'regular',
        paymentMethod: 'credit'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book ticket');
      console.error('Error booking ticket:', err);
    }
  };
  
  // Handle ticket cancellation
  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) {
      return;
    }
    
    try {
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}/cancel`);
      setSuccess('Ticket cancelled successfully!');
      
      // Refresh tickets
      fetchMyTickets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel ticket');
      console.error('Error cancelling ticket:', err);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <RefreshCw size={40} className="text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-blue-600 text-white p-1 rounded mr-2">
            <MapPin size={16} />
          </div>
          <span className="text-blue-600 font-bold text-xl">TransitTracker</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{user?.firstName}</span>
          </div>
          <button className="p-2 relative">
            <BellRing size={20} />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              {tickets.filter(t => t.status === 'active').length}
            </span>
          </button>
          <button className="p-2 bg-gray-100 rounded-full" onClick={() => setActiveTab('profile')}>
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex max-w-6xl mx-auto">
          <button 
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'tickets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('tickets')}
          >
            My Tickets
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'vehicles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Book Tickets
          </button>
          <button 
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full py-6 px-4">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5" size={18} />
            <div className="text-red-800">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5" size={18} />
            <div className="text-green-800">{success}</div>
          </div>
        )}
        
        {/* Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Passenger Dashboard</h1>
            
            {/* Map Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Live Vehicle Tracking</h2>
                <button
                  onClick={fetchVehicles}
                  className="flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Refresh
                </button>
              </div>
              <VehicleMap vehicles={vehicles} selectedVehicle={selectedVehicle} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total active tickets card */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 font-medium">Active Tickets</h3>
                <div className="mt-2 text-3xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'active').length}
                </div>
                <div className="mt-2">
                  <button 
                    className="text-blue-600 text-sm font-medium flex items-center"
                    onClick={() => setActiveTab('tickets')}
                  >
                    View tickets <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Available routes card */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 font-medium">Available Routes</h3>
                <div className="mt-2 text-3xl font-bold text-green-600">
                  {routes.length}
                </div>
                <div className="mt-2">
                  <button 
                    className="text-green-600 text-sm font-medium flex items-center"
                    onClick={() => setActiveTab('vehicles')}
                  >
                    Book a ticket <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Profile card */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 font-medium">Profile</h3>
                <div className="mt-2 text-lg font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <div className="mt-2">
                  <button 
                    className="text-indigo-600 text-sm font-medium flex items-center"
                    onClick={() => setActiveTab('profile')}
                  >
                    Manage profile <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Recent Tickets */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Tickets</h2>
                <button
                  className="text-blue-600 text-sm font-medium"
                  onClick={() => setActiveTab('tickets')}
                >
                  View all
                </button>
              </div>
              
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  You haven't booked any tickets yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Until
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.slice(0, 5).map((ticket) => (
                        <tr key={ticket._id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.route?.name || 'Unknown Route'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ticket.route?.routeNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${ticket.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(ticket.validUntil)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* My Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                onClick={() => setActiveTab('vehicles')}
              >
                Book New Ticket
              </button>
            </div>
            
            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <div className="max-w-md mx-auto">
                  <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't purchased any tickets yet. Book your first trip now!
                  </p>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    onClick={() => setActiveTab('vehicles')}
                  >
                    Book a Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Route Info
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valid Period
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tickets.map((ticket) => (
                        <tr key={ticket._id}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                ticket.route?.type === 'bus' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                              }`}>
                                {ticket.route?.type === 'bus' ? 'B' : 'T'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {ticket.route?.routeNumber || 'Unknown'} - {ticket.route?.name || 'Unknown Route'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ticket.route?.type === 'bus' ? 'Bus' : 'Train'} Route
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ticket.ticketType.charAt(0).toUpperCase() + ticket.ticketType.slice(1)} Ticket
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.fareCategory.charAt(0).toUpperCase() + ticket.fareCategory.slice(1)} fare - ${ticket.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              From: {formatDate(ticket.validFrom)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Until: {formatDate(ticket.validUntil)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            {ticket.status === 'active' && (
                              <button
                                onClick={() => handleCancelTicket(ticket._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                            
                            {ticket.status === 'used' && (
                              <span className="text-gray-500">Used ticket</span>
                            )}
                            
                            {ticket.status === 'expired' && (
                              <span className="text-gray-500">Expired</span>
                            )}
                            
                            {ticket.status === 'cancelled' && (
                              <span className="text-gray-500">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Book Tickets Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Book a Ticket</h1>
            
            {/* Route Selection */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select a Route</h2>
              
              {routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No routes available at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {routes.map((route) => (
                    <div 
                      key={route._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedRoute?._id === route._id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleRouteSelect(route)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-medium text-gray-900">
                          {route.routeNumber} - {route.name}
                        </div>
                        <div className={`px-2 py-1 text-xs font-semibold rounded ${
                          route.type === 'bus' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {route.type.charAt(0).toUpperCase() + route.type.slice(1)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        {route.distance ? `${route.distance} km` : 'Distance not specified'} • 
                        {route.estimatedDuration ? ` ${route.estimatedDuration} min` : ' Duration not specified'}
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <div className="text-sm font-medium">
                          <span className="text-gray-500">Regular fare:</span> ${route.fare ? route.fare.regular : 'N/A'}
                        </div>
                        <button
                          className="text-blue-600 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRouteSelect(route);
                            setShowBookingModal(true);
                          }}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Available Vehicles */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Vehicles</h2>
              
              {vehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No vehicles available at the moment.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Capacity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Features
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Route
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicles.filter(v => v.status === 'active').map((vehicle) => (
                          <tr key={vehicle._id}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                  vehicle.vehicleType === 'bus' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                }`}>
                                  {vehicle.vehicleType === 'bus' ? 'B' : 'T'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {vehicle.vehicleNumber}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {vehicle.capacity} seats
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex space-x-2">
                                {vehicle.features?.hasWifi && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    WiFi
                                  </span>
                                )}
                                {vehicle.features?.isAccessible && (
                                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                    Accessible
                                  </span>
                                )}
                                {vehicle.features?.hasBikeRack && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                    Bike Rack
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {vehicle.currentRoute ? (
                                  typeof vehicle.currentRoute === 'object' ? 
                                    `${vehicle.currentRoute.routeNumber} - ${vehicle.currentRoute.name}` :
                                    'Assigned route'
                                ) : (
                                  <span className="text-gray-500">No active route</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              <button
                                onClick={() => handleVehicleSelect(vehicle)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Book Ticket
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vehicle Tracker */}
                  {selectedVehicle && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Tracking</h3>
                      <VehicleTracker vehicleId={selectedVehicle._id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-red-600"
              >
                <LogOut size={16} className="mr-1" /> Sign Out
              </button>
            </div>
            
            {/* Profile Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                    value={user?.email}
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email address cannot be changed
                  </p>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    required
                    pattern="^\d{10}$"
                    title="Phone number must be 10 digits"
                  />
                </div>
                
                <div>
                  <label htmlFor="homeAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Home Address
                  </label>
                  <input
                    type="text"
                    id="homeAddress"
                    name="homeAddress"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={profileForm.homeAddress}
                    onChange={(e) => setProfileForm({...profileForm, homeAddress: e.target.value})}
                  />
                </div>
                
                <div>
                  <label htmlFor="workAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Work Address
                  </label>
                  <input
                    type="text"
                    id="workAddress"
                    name="workAddress"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={profileForm.workAddress}
                    onChange={(e) => setProfileForm({...profileForm, workAddress: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Update Profile
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-md text-sm font-medium hover:bg-red-50"
                  >
                    Delete Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Book a Ticket</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {!selectedRoute ? (
                <div className="text-center py-4 text-gray-500">
                  Please select a route first.
                </div>
              ) : (
                <form onSubmit={handleBookTicket} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Route
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="font-medium">{selectedRoute.routeNumber} - {selectedRoute.name}</div>
                      <div className="text-sm text-gray-500">
                        {selectedRoute.type.charAt(0).toUpperCase() + selectedRoute.type.slice(1)} • 
                        {selectedRoute.estimatedDuration ? ` ${selectedRoute.estimatedDuration} min` : ' Duration not specified'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="ticketType" className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Type
                    </label>
                    <select
                      id="ticketType"
                      name="ticketType"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={bookingForm.ticketType}
                      onChange={handleBookingChange}
                      required
                    >
                      <option value="single">Single Trip</option>
                      <option value="return">Return Trip</option>
                      <option value="day-pass">Day Pass</option>
                      <option value="week-pass">Week Pass</option>
                      <option value="month-pass">Month Pass</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="fareCategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Fare Category
                    </label>
                    <select
                      id="fareCategory"
                      name="fareCategory"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={bookingForm.fareCategory}
                      onChange={handleBookingChange}
                      required
                    >
                      <option value="regular">Regular</option>
                      <option value="student">Student</option>
                      <option value="senior">Senior</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={bookingForm.paymentMethod}
                      onChange={handleBookingChange}
                      required
                    >
                      <option value="credit">Credit Card</option>
                      <option value="debit">Debit Card</option>
                    </select>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Estimated Price:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${selectedRoute.fare ? (
                          bookingForm.fareCategory === 'student' ? 
                            selectedRoute.fare.student || selectedRoute.fare.regular : 
                          bookingForm.fareCategory === 'senior' ? 
                            selectedRoute.fare.senior || selectedRoute.fare.regular : 
                            selectedRoute.fare.regular
                        ).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between">
          <div>
          <h2 className="text-lg font-medium mb-2">TransitTracker</h2>
            <p className="text-sm text-gray-400">
              Real-time public transit tracking and booking
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-4">
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white">
                Help Center
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              &copy; {new Date().getFullYear()} TransitTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
