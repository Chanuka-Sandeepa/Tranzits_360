import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiAlertCircle, 
  FiClock, 
  FiLoader, 
  FiCalendar, 
  FiMap,
  FiRefreshCw,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';

const TripManagement = () => {
  // State management
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingResources, setLoadingResources] = useState(false);
  const [error, setError] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    routeId: '',
    vehicleId: '',
    driverId: '',
    startTime: '',
    status: 'scheduled',
    capacity: 0
  });

  // API configuration
  const API_URL = 'http://localhost:5001/api';
  const authToken = localStorage.getItem('token');

  // Fetch trips with proper error handling
  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/trips`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Handle different response structures
      const data = response.data;
      const tripsData = data.data || data.trips || data;
      
      if (!Array.isArray(tripsData)) {
        throw new Error('Unexpected response format from server');
      }

      // Format dates in the trips data
      const formattedTrips = tripsData.map(trip => ({
        ...trip,
        startTime: trip.startTime ? new Date(trip.startTime).toISOString() : null
      }));

      setTrips(formattedTrips);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         'Failed to fetch trips';
      setError(errorMessage);
      console.error('Fetch trips error:', err);
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [authToken]);

  // Fetch supporting data
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/routes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      setRoutes(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setRoutes([]);
    }
  }, [authToken]);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const vehicleData = response.data.data || response.data || [];
      setVehicles(vehicleData.filter(v => v.status === 'active'));
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setVehicles([]);
    }
  }, [authToken]);

  // Corrected: Properly fetch users with driver role
  const fetchDrivers = useCallback(async () => {
    try {
      // First try the admin-specific drivers endpoint
      const response = await axios.get(`${API_URL}/admin/drivers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Handle the response data
      const driversData = response.data.data || [];
      setDrivers(driversData);
    } catch (err) {
      console.error('Error fetching drivers from admin endpoint:', err);
      
      // Fallback to the general users endpoint with role filter
      try {
        const altResponse = await axios.get(`${API_URL}/users`, {
          params: { role: 'driver' },
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        // Handle different response structures
        const data = altResponse.data;
        let driversData = [];
        
        if (Array.isArray(data)) {
          driversData = data;
        } else if (data.data && Array.isArray(data.data)) {
          driversData = data.data;
        } else if (data.users && Array.isArray(data.users)) {
          driversData = data.users;
        }
        
        // Filter only active drivers
        const activeDrivers = driversData.filter(driver => 
          !driver.status || driver.status === 'active'
        );
        
        setDrivers(activeDrivers);
      } catch (altErr) {
        console.error('Error fetching drivers from users endpoint:', altErr);
        setDrivers([]);
      }
    }
  }, [authToken]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoadingResources(true);
      try {
        await Promise.all([
          fetchTrips(),
          fetchRoutes(),
          fetchVehicles(),
          fetchDrivers()
        ]);
      } catch (err) {
        console.error('Initial data loading error:', err);
        setError('Error loading application data. Please refresh the page.');
      } finally {
        setLoadingResources(false);
      }
    };
    
    loadData();
  }, [fetchTrips, fetchRoutes, fetchVehicles, fetchDrivers]);

  // Helper functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'vehicleId') {
      const selectedVehicle = vehicles.find(v => v._id === value);
      if (selectedVehicle) {
        setFormData(prev => ({ ...prev, capacity: selectedVehicle.capacity }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      vehicleId: '',
      driverId: '',
      startTime: '',
      status: 'scheduled',
      capacity: 0
    });
    setSelectedTrip(null);
  };

  // Corrected: Improved modal handling with better driver ID extraction
  const handleOpenModal = (trip = null) => {
    if (trip) {
      setSelectedTrip(trip);
      // Convert to local datetime format for the input
      let formattedDate = '';
      if (trip.startTime) {
        try {
          const departureTime = new Date(trip.startTime);
          // Format the date to YYYY-MM-DDThh:mm format for datetime-local input
          formattedDate = departureTime.toISOString().slice(0, 16);
        } catch (err) {
          console.error('Error formatting date:', err);
          formattedDate = '';
        }
      }
      
      // Handle different possible structures for driver ID
      let driverId = '';
      if (trip.driver) {
        if (typeof trip.driver === 'string') {
          driverId = trip.driver;
        } else if (trip.driver._id) {
          driverId = trip.driver._id;
        }
      }
      
      setFormData({
        routeId: trip.route?._id || trip.routeId || trip.route || '',
        vehicleId: trip.vehicle?._id || trip.vehicleId || trip.vehicle || '',
        driverId: driverId,
        startTime: formattedDate,
        status: trip.status || 'scheduled',
        capacity: trip.vehicle?.capacity || trip.capacity || 0
      });
    } else {
      // For new trips, set default start time to current time
      const now = new Date();
      const formattedNow = now.toISOString().slice(0, 16);
      
      setFormData({
        routeId: '',
        vehicleId: '',
        driverId: '',
        startTime: formattedNow,
        status: 'scheduled',
        capacity: 0
      });
    }
    setIsModalOpen(true);
  };

  // Fix: Updated submit handler for creating and updating trips
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingTrips(true);
    
    try {
      // Ensure the date is properly formatted before sending to the server
      const tripData = {
        routeId: formData.routeId,
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        startTime: new Date(formData.startTime).toISOString(),
        status: formData.status,
        capacity: formData.capacity
      };

      if (selectedTrip) {
        // If we're updating a trip
        if (selectedTrip.status !== formData.status) {
          // If only the status has changed, just update the status
          await axios.put(
            `${API_URL}/trips/${selectedTrip._id}/status`, 
            { status: formData.status },
            { headers: { 'Authorization': `Bearer ${authToken}` } }
          );
        } else {
          // Otherwise update the full trip details
          await axios.put(
            `${API_URL}/trips/${selectedTrip._id}`, 
            tripData,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
          );
        }
      } else {
        // Creating a new trip
        const response = await axios.post(
          `${API_URL}/trips`, 
          tripData,
          { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to create trip');
        }
      }
      
      await fetchTrips();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving trip:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save trip');
    } finally {
      setLoadingTrips(false);
    }
  };

  // Fix: Added delete trip handler
  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    
    setLoadingTrips(true);
    try {
      await axios.delete(`${API_URL}/trips/${selectedTrip._id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      await fetchTrips();
      setIsDeleteModalOpen(false);
      setSelectedTrip(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete trip');
      console.error('Error deleting trip:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Fixed: More robust helper functions to handle various data formats
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      };
      return date.toLocaleString(undefined, options);
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Invalid Date';
    }
  };

  const getRouteName = (routeId) => {
    if (!routeId) return 'Unknown Route';
    if (typeof routeId === 'object' && routeId.name) return routeId.name;
    
    const route = routes.find(r => r._id === routeId);
    return route ? route.name : 'Unknown Route';
  };

  const getVehicleInfo = (vehicleId) => {
    if (!vehicleId) return 'Unknown Vehicle';
    if (typeof vehicleId === 'object') {
      const vehicle = vehicleId;
      return vehicle.model || vehicle.vehicleType 
        ? `${vehicle.model || vehicle.vehicleType} (${vehicle.registrationNumber || vehicle.vehicleNumber})` 
        : 'Unknown Vehicle';
    }
    
    const vehicle = vehicles.find(v => v._id === vehicleId);
    return vehicle 
      ? `${vehicle.model || vehicle.vehicleType} (${vehicle.registrationNumber || vehicle.vehicleNumber})` 
      : 'Unknown Vehicle';
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'Unassigned';
    if (typeof driverId === 'object') {
      const driver = driverId;
      return driver.firstName ? `${driver.firstName} ${driver.lastName || ''}` : 'Unassigned';
    }
    
    const driver = drivers.find(d => d._id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName || ''}` : 'Unassigned';
  };

  const exportTripsToCSV = () => {
    // Prepare CSV header
    let csv = 'Trip ID,Route,Vehicle,Driver,Departure Time,Status,Capacity,Passengers\n';
    
    // Add trip data
    trips.forEach(trip => {
      const routeName = trip.route?.name || getRouteName(trip.route);
      const vehicleInfo = trip.vehicle?.model 
        ? `${trip.vehicle.model} (${trip.vehicle.registrationNumber || trip.vehicle.vehicleNumber})` 
        : getVehicleInfo(trip.vehicle);
      const driverName = trip.driver?.firstName 
        ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` 
        : getDriverName(trip.driver);
      
      csv += `${trip._id},`;
      csv += `${routeName},`;
      csv += `${vehicleInfo},`;
      csv += `${driverName},`;
      csv += `${formatDateTime(trip.startTime)},`;
      csv += `${trip.status},`;
      csv += `${trip.capacity || trip.vehicle?.capacity || 0},`;
      csv += `${trip.passengers?.length || 0}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `trips_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trip Management</h2>
        <div className="flex space-x-2">
          <button 
            onClick={exportTripsToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Export Trips
          </button>
          <button 
            onClick={fetchTrips}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FiRefreshCw className={`mr-2 ${loadingTrips ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" /> Schedule Trip
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            &times;
          </button>
        </div>
      )}

      {loadingResources ? (
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin text-indigo-600 text-2xl mr-2" />
          <span>Loading application data...</span>
          </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingTrips && trips.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <FiLoader className="animate-spin text-indigo-600 mr-2" />
                      Loading trips...
                    </div>
                  </td>
                </tr>
              ) : trips.length > 0 ? (
                trips.map((trip) => {
                  const routeName = trip.route?.name || getRouteName(trip.route);
                  const vehicleInfo = trip.vehicle?.model 
                    ? `${trip.vehicle.model} (${trip.vehicle.registrationNumber || trip.vehicle.vehicleNumber})` 
                    : getVehicleInfo(trip.vehicle);
                  const driverName = trip.driver?.firstName 
                    ? `${trip.driver.firstName} ${trip.driver.lastName || ''}` 
                    : getDriverName(trip.driver);
                  
                  return (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{routeName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{vehicleInfo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{driverName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trip.startTime ? formatDateTime(trip.startTime) : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3">
                        <button 
                          onClick={() => {
                            setSelectedTrip(trip);
                            setIsViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(trip)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={trip.status === 'completed' || trip.status === 'cancelled'}
                          title="Edit Trip"
                        >
                          <FiEdit className={`${(trip.status === 'completed' || trip.status === 'cancelled') ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedTrip(trip);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Trip"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {error ? 'Error loading trips' : 'No trips found. Schedule a trip to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule/Update Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {selectedTrip ? `Update Trip: ${getRouteName(selectedTrip.route)}` : 'Schedule New Trip'}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* Show all fields for new trips or editing non-completed/cancelled trips */}
              {(!selectedTrip || (selectedTrip && selectedTrip.status !== 'completed' && selectedTrip.status !== 'cancelled')) && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Route
                    </label>
                    <select
                      name="routeId"
                      value={formData.routeId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={loadingTrips}
                    >
                      <option value="">Select a route</option>
                      {routes.map(route => (
                        <option key={route._id} value={route._id}>
                          {route.name || route.routeName || `Route ${route.routeNumber || '#'}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Vehicle
                    </label>
                    <select
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={loadingTrips}
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.model || vehicle.vehicleType} ({vehicle.registrationNumber || vehicle.vehicleNumber}) - {vehicle.capacity} seats
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Driver
                    </label>
                    <select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={loadingTrips}
                    >
                      <option value="">Select a driver</option>
                      {drivers && drivers.length > 0 ? (
                        drivers.map(driver => (
                          <option key={driver._id} value={driver._id}>
                            {driver.firstName} {driver.lastName || ''} {driver.phone ? `(${driver.phone})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No drivers available</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Departure Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                      disabled={loadingTrips}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      readOnly
                    />
                  </div>
                </>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  disabled={loadingTrips}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={loadingTrips}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  disabled={loadingTrips}
                >
                  {loadingTrips ? (
                    <>
                      <FiLoader className="animate-spin inline mr-2" />
                      {selectedTrip ? 'Updating...' : 'Scheduling...'}
                    </>
                  ) : (
                    selectedTrip ? 'Update Trip' : 'Schedule Trip'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete the trip for route <strong>{selectedTrip.route?.name || getRouteName(selectedTrip.route)}</strong> scheduled for <strong>{formatDateTime(selectedTrip.startTime)}</strong>?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loadingTrips}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrip}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={loadingTrips}
              >
                {loadingTrips ? (
                  <>
                    <FiLoader className="animate-spin inline mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Trip Details Modal */}
      {isViewModalOpen && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Trip Details</h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <FiMap className="text-indigo-600 mt-1 mr-2" />
                  <div>
                    <h4 className="font-semibold text-indigo-900">Route</h4>
                    <p className="text-indigo-700">
                      {selectedTrip.route?.name || getRouteName(selectedTrip.route)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <FiCalendar className="text-green-600 mt-1 mr-2" />
                  <div>
                    <h4 className="font-semibold text-green-900">Schedule</h4>
                    <p className="text-green-700">
                      Departure: {formatDateTime(selectedTrip.startTime)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Status: <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedTrip.status)}`}>
                        {selectedTrip.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Vehicle Information</h4>
                {(() => {
                  const vehicle = selectedTrip.vehicle?._id 
                    ? selectedTrip.vehicle 
                    : vehicles.find(v => v._id === selectedTrip.vehicle);
                    
                  return vehicle ? (
                    <div>
                      <p><span className="font-medium">Model:</span> {vehicle.model || vehicle.vehicleType}</p>
                      <p><span className="font-medium">Registration:</span> {vehicle.registrationNumber || vehicle.vehicleNumber}</p>
                      <p><span className="font-medium">Capacity:</span> {vehicle.capacity} passengers</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Vehicle information not available</p>
                  );
                })()}
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Driver Information</h4>
                {(() => {
                  const driver = selectedTrip.driver?._id 
                    ? selectedTrip.driver 
                    : drivers.find(d => d._id === selectedTrip.driver);
                    
                  return driver ? (
                    <div>
                      <p><span className="font-medium">Name:</span> {driver.firstName} {driver.lastName}</p>
                      <p><span className="font-medium">Phone:</span> {driver.phone || 'Not provided'}</p>
                      {driver.licenseNumber && (
                        <p><span className="font-medium">License:</span> {driver.licenseNumber}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Driver information not available</p>
                  );
                })()}
              </div>
            </div>
            
            {selectedTrip.incidents && selectedTrip.incidents.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-semibold text-red-600 flex items-center mb-2">
                  <FiAlertCircle className="mr-2" /> Reported Incidents
                </h4>
                <div className="space-y-2">
                  {selectedTrip.incidents.map((incident, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-md">
                      <p className="text-sm text-red-700">{incident.description}</p>
                      <p className="text-xs text-red-500 mt-1">
                        Reported: {new Date(incident.time || incident.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              {selectedTrip.status !== 'completed' && selectedTrip.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenModal(selectedTrip);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Edit Trip
                </button>
              )}
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;


