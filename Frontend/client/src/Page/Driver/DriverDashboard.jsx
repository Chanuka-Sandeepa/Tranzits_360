import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FiHome, FiUser, FiTruck, FiLogOut, FiMenu, FiX, 
  FiEdit, FiTrash2, FiPlusCircle, FiCheck, FiAlertCircle
} from 'react-icons/fi';

const DriverDashboard = () => {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [driver, setDriver] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form loading states
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isVehicleSubmitting, setIsVehicleSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: ''
  });
  
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    vehicleType: 'bus',
    capacity: 0,
    routes: [],
    currentRoute: '',
    nextMaintenanceDue: '',
    features: {
      hasWifi: false,
      isAccessible: true,
      hasBikeRack: false
    }
  });

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ type: '', id: '' });

  const navigate = useNavigate();
  const location = useLocation();

  // Get user from local storage
  const user = JSON.parse(localStorage.getItem("user")) || null;
  const userRole = user ? user.role : null;

  // Check if user is a driver
  useEffect(() => {
      setupAxios();
      fetchDriverData();
    
  }, []);

  const setupAxios = () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const fetchDriverData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch driver profile
      const driverRes = await axios.get('http://localhost:5000/api/auth/me');
      setDriver(driverRes.data.user);
      setProfileForm({
        firstName: driverRes.data.user.firstName || '',
        lastName: driverRes.data.user.lastName || '',
        email: driverRes.data.user.email || '',
        phone: driverRes.data.user.phone || '',
        licenseNumber: driverRes.data.user.licenseNumber || '',
        licenseExpiry: driverRes.data.user.licenseExpiry ? 
          new Date(driverRes.data.user.licenseExpiry).toISOString().split('T')[0] : ''
      });

      // Fetch driver's vehicles
      const vehiclesRes = await axios.get('http://localhost:5000/api/driver/vehicles');
      setVehicles(vehiclesRes.data.data);

      // Fetch routes for vehicle assignment
      const routesRes = await axios.get('http://localhost:5000/api/routes');
      setRoutes(routesRes.data.data);
    } catch (error) {
      console.error('Error fetching driver data:', error);
      setError('Failed to load your dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset states when changing tabs
    setEditingVehicle(null);
    setShowDeleteConfirm(false);
    setError(null);
    setSuccess(null);
    
    // Reset vehicle form when not editing
    if (tab !== 'vehicles' || !editingVehicle) {
      setVehicleForm({
        vehicleNumber: '',
        vehicleType: 'bus',
        capacity: 0,
        routes: [],
        currentRoute: '',
        nextMaintenanceDue: '',
        features: {
          hasWifi: false,
          isAccessible: true,
          hasBikeRack: false
        }
      });
    }
  };

  // Profile management functions
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsProfileSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.put(`http://localhost:5000/api/auth/update-profile`, profileForm);
      setDriver(response.data.user);
      setSuccess('Profile updated successfully');
      // Update local storage user data
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteSubmitting(true);
    setError(null);
    
    try {
      await axios.delete(`http://localhost:5000/api/auth/delete`);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
      setIsDeleteSubmitting(false);
    }
  };

  // Vehicle management functions
  const handleVehicleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('features.')) {
      const featureName = name.split('.')[1];
      setVehicleForm(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [featureName]: checked
        }
      }));
    } else {
      setVehicleForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleRouteSelect = (e) => {
    const { options } = e.target;
    const selectedRoutes = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setVehicleForm(prev => ({
      ...prev,
      routes: selectedRoutes
    }));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setIsVehicleSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare vehicle data
      const vehicleData = {
        ...vehicleForm,
        nextMaintenanceDue: new Date(vehicleForm.nextMaintenanceDue),
        driver: driver._id  // Add the driver ID here
      };
      
      // If currentRoute is selected but not in routes array, add it
      if (vehicleData.currentRoute && !vehicleData.routes.includes(vehicleData.currentRoute)) {
        vehicleData.routes.push(vehicleData.currentRoute);
      }
      
      let response;
      if (editingVehicle) {
        // Update existing vehicle
        response = await axios.put(`http://localhost:5000/api/vehicles/${editingVehicle._id}`, vehicleData);
        setSuccess('Vehicle updated successfully');
      } else {
        // Add new vehicle
        response = await axios.post('http://localhost:5000/api/vehicles', vehicleData);
        setSuccess('Vehicle added successfully');
      }
      
      // Refresh vehicles list
      fetchDriverData();
      
      // Reset form and editing state
      setVehicleForm({
        vehicleNumber: '',
        vehicleType: 'bus',
        capacity: 0,
        routes: [],
        currentRoute: '',
        nextMaintenanceDue: '',
        features: {
          hasWifi: false,
          isAccessible: true,
          hasBikeRack: false
        }
      });
      setEditingVehicle(null);
    } catch (error) {
      console.error('Error with vehicle operation:', error);
      setError(error.response?.data?.message || 'Failed to process vehicle data');
    } finally {
      setIsVehicleSubmitting(false);
    }
  };
  

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    
    // Format the maintenance date for the input
    const formattedDate = vehicle.nextMaintenanceDue ? 
      new Date(vehicle.nextMaintenanceDue).toISOString().split('T')[0] : '';
    
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber || '',
      vehicleType: vehicle.vehicleType || 'bus',
      capacity: vehicle.capacity || 0,
      routes: vehicle.routes?.map(r => typeof r === 'object' ? r._id : r) || [],
      currentRoute: vehicle.currentRoute?._id || vehicle.currentRoute || '',
      nextMaintenanceDue: formattedDate,
      features: {
        hasWifi: vehicle.features?.hasWifi || false,
        isAccessible: vehicle.features?.isAccessible || true,
        hasBikeRack: vehicle.features?.hasBikeRack || false
      }
    });
    
    setActiveTab('vehicles');
  };

  const handleDeleteRequest = (type, id) => {
    setItemToDelete({ type, id });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteSubmitting(true);
    setError(null);
    
    try {
      if (itemToDelete.type === 'vehicle') {
        await axios.delete(`http://localhost:5000/api/vehicles/${itemToDelete.id}`);
        setSuccess('Vehicle deleted successfully');
        fetchDriverData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.response?.data?.message || `Failed to delete ${itemToDelete.type}`);
    } finally {
      setIsDeleteSubmitting(false);
      setShowDeleteConfirm(false);
      setItemToDelete({ type: '', id: '' });
    }
  };

  // Render dashboard sections
  const renderOverview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 col-span-full">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-lg font-medium">{driver?.firstName} {driver?.lastName}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-lg font-medium">{driver?.email}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-500">Phone</div>
              <div className="text-lg font-medium">{driver?.phone}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-500">License Number</div>
              <div className="text-lg font-medium">{driver?.licenseNumber || "Not set"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 col-span-full md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Vehicles</h3>
          <div className="text-2xl font-bold text-green-600 mb-2">{vehicles.length}</div>
          <p className="text-gray-600">Total registered vehicles</p>
          <button
            onClick={() => handleTabChange('vehicles')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
          >
            <FiTruck className="mr-2" /> Manage Vehicles
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 col-span-full md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Routes</h3>
          <div className="text-2xl font-bold text-blue-600 mb-2">{routes.length}</div>
          <p className="text-gray-600">Routes you can assign</p>
          <button
            onClick={() => handleTabChange('vehicles')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
          >
            <FiPlusCircle className="mr-2" /> Add New Vehicle
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 col-span-full md:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account</h3>
          <p className="text-gray-600 mb-4">Manage your driver profile and settings</p>
          <button
            onClick={() => handleTabChange('profile')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md"
          >
            <FiUser className="mr-2" /> Update Profile
          </button>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Driver Profile</h3>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            <div className="flex">
              <FiCheck className="h-5 w-5 text-green-500 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profileForm.firstName}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profileForm.lastName}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                disabled
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                required
                pattern="^\d{10}$"
                title="Phone number must be 10 digits"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={profileForm.licenseNumber}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">License Expiry Date</label>
              <input
                type="date"
                name="licenseExpiry"
                value={profileForm.licenseExpiry}
                onChange={handleProfileChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isProfileSubmitting}
            >
              {isProfileSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
            
            <button
              type="button"
              onClick={() => handleDeleteRequest('account', user._id)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderVehicles = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
          {editingVehicle && (
            <button
              onClick={() => setEditingVehicle(null)}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            <div className="flex">
              <FiCheck className="h-5 w-5 text-green-500 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleAddVehicle} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={vehicleForm.vehicleNumber}
                  onChange={handleVehicleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={vehicleForm.vehicleType}
                  onChange={handleVehicleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={vehicleForm.capacity}
                  onChange={handleVehicleChange}
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Next Maintenance Due</label>
                <input
                  type="date"
                  name="nextMaintenanceDue"
                  value={vehicleForm.nextMaintenanceDue}
                  onChange={handleVehicleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Route</label>
                <select
                  name="currentRoute"
                  value={vehicleForm.currentRoute}
                  onChange={handleVehicleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- None --</option>
                  {routes.map(route => (
                    <option key={route._id} value={route._id}>
                      {route.routeNumber} - {route.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isVehicleSubmitting}
              >
                {isVehicleSubmitting 
                  ? (editingVehicle ? 'Updating...' : 'Adding...') 
                  : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')
                }
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">My Vehicles</h3>
          </div>
          {vehicles.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              You haven't added any vehicles yet. Add your first vehicle above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Capacity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Route
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance Due
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.vehicleNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.vehicleType === 'bus' ? '🚌' : '🚆'} {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)} ({vehicle.capacity} seats)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.currentRoute ? (
                          typeof vehicle.currentRoute === 'object' ? 
                            `${vehicle.currentRoute.routeNumber} - ${vehicle.currentRoute.name}` : 
                            'Loading...'
                        ) : (
                          <span className="text-yellow-500">No active route</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.nextMaintenanceDue ? (
                          new Date(vehicle.nextMaintenanceDue) < new Date() ? 
                            <span className="text-red-500 font-medium">Overdue</span> : 
                            new Date(vehicle.nextMaintenanceDue).toLocaleDateString()
                        ) : (
                          'Not scheduled'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest('vehicle', vehicle._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="inline mr-1" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Delete confirmation modal
  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <div className="flex justify-center">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Confirm Delete</h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                {itemToDelete.type === 'account' ? 
                  'Are you sure you want to delete your account? This action cannot be undone.' : 
                  'Are you sure you want to delete this vehicle? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex justify-center gap-4 mt-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={itemToDelete.type === 'account' ? handleDeleteAccount : handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleteSubmitting}
              >
                {isDeleteSubmitting ? 'Processing...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
            <div className="w-10 h-10 bg-green-600 rounded-md flex items-center justify-center">
              <FiTruck className="text-white text-xl" />
            </div>
            <h1 className="ml-3 text-xl font-semibold text-gray-800">Driver Portal</h1>
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
            <button
              onClick={() => handleTabChange('overview')}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiHome className="mr-3 text-lg" />
              Overview
            </button>
            
            <button
              onClick={() => handleTabChange('profile')}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiUser className="mr-3 text-lg" />
              My Profile
            </button>
            
            <button
              onClick={() => handleTabChange('vehicles')}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'vehicles' 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiTruck className="mr-3 text-lg" />
              My Vehicles
            </button>
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
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'profile' && 'My Profile'}
                  {activeTab === 'vehicles' && 'Vehicle Management'}
                </h2>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="flex items-center cursor-pointer">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium">
                        {driver?.firstName?.charAt(0) || 'D'}
                      </span>
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                      {driver?.firstName} {driver?.lastName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'profile' && renderProfile()}
              {activeTab === 'vehicles' && renderVehicles()}
            </>
          )}
        </main>
      </div>
      
      {/* Delete Confirmation Modal */}
      {renderDeleteConfirmModal()}
    </div>
  );
};

export default DriverDashboard;

