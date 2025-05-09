import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiLoader, FiClock, FiMap, FiTruck, FiUser, FiDownload } from 'react-icons/fi';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [routes, setRoutes] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchRoutes();
    fetchDrivers();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/vehicles', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Format dates in the vehicle data
        const formattedVehicles = response.data.data.map(vehicle => ({
          ...vehicle,
          departureTime: vehicle.departureTime ? new Date(vehicle.departureTime).toISOString() : null,
          nextMaintenanceDue: vehicle.nextMaintenanceDue ? new Date(vehicle.nextMaintenanceDue).toISOString() : null
        }));
        setVehicles(formattedVehicles);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch vehicles');
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access vehicles.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch vehicles. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/routes', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setRoutes(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/admin/users?role=driver', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setDrivers(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  const handleOpenViewModal = async (vehicleId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/vehicles/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSelectedVehicle(response.data.data);
        setIsViewModalOpen(true);
      } else {
        setError(response.data.message || 'Failed to fetch vehicle details');
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access vehicle details.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch vehicle details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedVehicle(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const exportVehiclesToCSV = () => {
    // Prepare CSV header
    let csv = 'Vehicle Number,Type,Capacity,Driver,Current Route,Departure Time,Maintenance Due,Features\n';
    
    // Add vehicle data
    vehicles.forEach(vehicle => {
      const features = [];
      if (vehicle.features?.hasAC) features.push('Air Conditioning');
      if (vehicle.features?.hasWifi) features.push('WiFi');
      if (vehicle.features?.hasAccessibility) features.push('Accessibility');
      
      csv += `${vehicle.vehicleNumber},`;
      csv += `${vehicle.vehicleType},`;
      csv += `${vehicle.capacity},`;
      csv += `${vehicle.driver ? `${vehicle.driver.name || vehicle.driver.email}` : 'Unassigned'},`;
      csv += `${vehicle.currentRoute ? vehicle.currentRoute.name : 'None'},`;
      csv += `${vehicle.departureTime ? formatDate(vehicle.departureTime) : 'Not scheduled'},`;
      csv += `${formatDate(vehicle.nextMaintenanceDue)},`;
      csv += `${features.join('; ')}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Vehicle Management</h2>
        <button 
          onClick={exportVehiclesToCSV}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiDownload className="-ml-1 mr-2 h-5 w-5" />
          Export Vehicles
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading && vehicles.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin text-indigo-600 text-2xl mr-2" />
          <span>Loading vehicles...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Due</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr 
                    key={vehicle._id} 
                    className="hover:bg-gray-50 cursor-pointer" 
                    onClick={() => handleOpenViewModal(vehicle._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.vehicleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.vehicleType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.driver ? `${vehicle.driver.name || vehicle.driver.email}` : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.currentRoute ? vehicle.currentRoute.name : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vehicle.departureTime ? formatDate(vehicle.departureTime) : 'Not scheduled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(vehicle.nextMaintenanceDue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Vehicle Details Modal */}
      {isViewModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Vehicle Details</h3>
              <button 
                onClick={handleCloseViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <FiTruck className="text-indigo-600 mt-1 mr-2 text-xl" />
                <div>
                  <h4 className="font-semibold text-indigo-900">Vehicle Information</h4>
                  <p className="text-indigo-700">
                    {selectedVehicle.vehicleNumber} - {selectedVehicle.vehicleType}
                  </p>
                  <p className="text-sm text-indigo-600 mt-1">
                    Capacity: {selectedVehicle.capacity} passengers
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <FiUser className="text-gray-600 mt-1 mr-2" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Driver Information</h4>
                    {selectedVehicle.driver ? (
                      <div className="text-gray-600">
                        <p>Name: {selectedVehicle.driver.name || `${selectedVehicle.driver.firstName || ''} ${selectedVehicle.driver.lastName || ''}`}</p>
                        <p>Email: {selectedVehicle.driver.email || 'Not provided'}</p>
                        <p>Phone: {selectedVehicle.driver.phone || 'Not provided'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No driver assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <FiClock className="text-gray-600 mt-1 mr-2" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Maintenance</h4>
                    <p className="text-gray-600">
                      Next scheduled: {formatDate(selectedVehicle.nextMaintenanceDue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Features</h4>
              <div className="flex flex-wrap gap-2">
                {selectedVehicle.features?.hasAC && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Air Conditioning
                  </span>
                )}
                {selectedVehicle.features?.hasWifi && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    WiFi
                  </span>
                )}
                {selectedVehicle.features?.hasAccessibility && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Accessibility Features
                  </span>
                )}
                {(!selectedVehicle.features || 
                  (!selectedVehicle.features.hasAC && 
                   !selectedVehicle.features.hasWifi && 
                   !selectedVehicle.features.hasAccessibility)) && (
                  <span className="text-gray-500">No special features</span>
                )}
              </div>
            </div>
            
            <div className="border border-gray-200 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Assigned Routes</h4>
              {selectedVehicle.routes && selectedVehicle.routes.length > 0 ? (
                <div className="space-y-2">
                  {selectedVehicle.routes.map(route => (
                    <div 
                      key={route._id} 
                      className={`p-2 rounded-md ${selectedVehicle.currentRoute && selectedVehicle.currentRoute._id === route._id ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <FiMap className={`mr-2 ${selectedVehicle.currentRoute && selectedVehicle.currentRoute._id === route._id ? 'text-yellow-600' : 'text-gray-600'}`} />
                        <div>
                          <p className="font-medium">
                            {route.name || 'Unnamed Route'}
                            {selectedVehicle.currentRoute && selectedVehicle.currentRoute._id === route._id && (
                              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Current</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {route.from || 'Start'} → {route.to || 'End'}
                          </p>
                          {route.stops && route.stops.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {route.stops.length} stops
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No routes assigned</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;