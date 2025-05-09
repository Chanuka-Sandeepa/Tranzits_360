// src/pages/admin/RouteManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit2, FiTrash2, FiMap, FiPlus, FiX, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRouteId, setCurrentRouteId] = useState(null);
  
  // Form state for new/edit route
  const [newRoute, setNewRoute] = useState({
    routeNumber: '',
    name: '',
    type: 'bus',
    distance: '',
    estimatedDuration: '',
    fare: {
      regular: '',
      student: '',
      senior: ''
    },
    stops: [],
    schedule: [
      {
        dayOfWeek: 0,
        departureTimesFromOrigin: ['']
      }
    ]
  });
  
  // State for managing stop inputs
  const [stopForm, setStopForm] = useState({
    name: '',
    location: {
      coordinates: ['', ''] // [longitude, latitude]
    },
    estimatedArrivalTime: ''
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      // The getAllRoutes endpoint is public, but we'll include auth header anyway for consistency
      const response = await axios.get('http://localhost:5000/api/routes', getAuthHeader());
      if (response.data && response.data.data) {
        setRoutes(response.data.data);
      } else {
        setRoutes([]);
        setError('Unexpected API response format');
      }
    } catch (err) {
      setError('Failed to load routes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteById = async (routeId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/routes/${routeId}`,
        getAuthHeader()
      );
      
      if (response.data && response.data.data) {
        const routeData = response.data.data;
        setNewRoute({
          routeNumber: routeData.routeNumber || '',
          name: routeData.name || '',
          type: routeData.type || 'bus',
          distance: routeData.distance || '',
          estimatedDuration: routeData.estimatedDuration || '',
          fare: {
            regular: routeData.fare?.regular || '',
            student: routeData.fare?.student || '',
            senior: routeData.fare?.senior || ''
          },
          stops: routeData.stops || [],
          schedule: routeData.schedule || [
            {
              dayOfWeek: 0,
              departureTimesFromOrigin: ['']
            }
          ]
        });
        setCurrentRouteId(routeId);
        setIsEditing(true);
        setShowModal(true);
      }
    } catch (err) {
      setError('Failed to fetch route details: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditRoute = (routeId) => {
    fetchRouteById(routeId);
  };

  const handleDeleteRoute = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await axios.delete(
          `http://localhost:5000/api/routes/${routeId}`,
          getAuthHeader()
        );
        fetchRoutes(); // Refresh the list after deletion
      } catch (err) {
        setError('Failed to delete route: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  // Handler for input changes in the main form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewRoute(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewRoute(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handler for stop form input changes
  const handleStopInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child, index] = name.split('.');
      setStopForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: prev[parent][child].map((val, i) => i === parseInt(index) ? value : val)
        }
      }));
    } else {
      setStopForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add stop to the route
  const addStop = () => {
    // Validate the stop form first
    const errors = {};
    if (!stopForm.name) errors.stopName = 'Stop name is required';
    if (!stopForm.location.coordinates[0]) errors.longitude = 'Longitude is required';
    if (!stopForm.location.coordinates[1]) errors.latitude = 'Latitude is required';
    if (!stopForm.estimatedArrivalTime) errors.estimatedArrivalTime = 'Estimated arrival time is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newStop = {
      name: stopForm.name,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(stopForm.location.coordinates[0]),
          parseFloat(stopForm.location.coordinates[1])
        ]
      },
      estimatedArrivalTime: parseInt(stopForm.estimatedArrivalTime)
    };

    setNewRoute(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }));

    // Reset the stop form
    setStopForm({
      name: '',
      location: {
        coordinates: ['', '']
      },
      estimatedArrivalTime: ''
    });
  };

  // Remove a stop from the route
  const removeStop = (index) => {
    setNewRoute(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  // Add a new schedule entry
  const addSchedule = () => {
    setNewRoute(prev => ({
      ...prev,
      schedule: [...prev.schedule, {
        dayOfWeek: 0,
        departureTimesFromOrigin: ['']
      }]
    }));
  };

  // Remove a schedule entry
  const removeSchedule = (index) => {
    setNewRoute(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  // Add departure time to a schedule
  const addDepartureTime = (scheduleIndex) => {
    setNewRoute(prev => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[scheduleIndex].departureTimesFromOrigin.push('');
      return {
        ...prev,
        schedule: updatedSchedule
      };
    });
  };

  // Remove departure time from a schedule
  const removeDepartureTime = (scheduleIndex, timeIndex) => {
    setNewRoute(prev => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[scheduleIndex].departureTimesFromOrigin = 
        updatedSchedule[scheduleIndex].departureTimesFromOrigin.filter((_, i) => i !== timeIndex);
      return {
        ...prev,
        schedule: updatedSchedule
      };
    });
  };

  // Handle schedule input changes
  const handleScheduleChange = (scheduleIndex, field, value) => {
    setNewRoute(prev => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[scheduleIndex][field] = value;
      return {
        ...prev,
        schedule: updatedSchedule
      };
    });
  };

  // Handle departure time changes
  const handleDepartureTimeChange = (scheduleIndex, timeIndex, value) => {
    setNewRoute(prev => {
      const updatedSchedule = [...prev.schedule];
      updatedSchedule[scheduleIndex].departureTimesFromOrigin[timeIndex] = value;
      return {
        ...prev,
        schedule: updatedSchedule
      };
    });
  };

  // Reset form and modal state
  const resetForm = () => {
    setNewRoute({
      routeNumber: '',
      name: '',
      type: 'bus',
      distance: '',
      estimatedDuration: '',
      fare: {
        regular: '',
        student: '',
        senior: ''
      },
      stops: [],
      schedule: [
        {
          dayOfWeek: 0,
          departureTimesFromOrigin: ['']
        }
      ]
    });
    setIsEditing(false);
    setCurrentRouteId(null);
    setFormErrors({});
  };

  // Handle modal close
  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  // Submit the form to create or update a route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    // Validate form
    const errors = {};
    if (!newRoute.routeNumber) errors.routeNumber = 'Route number is required';
    if (!newRoute.name) errors.name = 'Route name is required';
    if (!newRoute.distance) errors.distance = 'Distance is required';
    if (!newRoute.estimatedDuration) errors.estimatedDuration = 'Estimated duration is required';
    if (!newRoute.fare.regular) errors.fareRegular = 'Regular fare is required';
    if (!newRoute.fare.student) errors.fareStudent = 'Student fare is required';
    if (!newRoute.fare.senior) errors.fareSenior = 'Senior fare is required';
    if (newRoute.stops.length < 2) errors.stops = 'At least two stops are required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      // Convert string numbers to actual numbers
      const routeData = {
        ...newRoute,
        distance: parseFloat(newRoute.distance),
        estimatedDuration: parseInt(newRoute.estimatedDuration),
        fare: {
          regular: parseFloat(newRoute.fare.regular),
          student: parseFloat(newRoute.fare.student),
          senior: parseFloat(newRoute.fare.senior)
        }
      };

      if (isEditing) {
        // Update existing route
        await axios.put(
          `http://localhost:5000/api/routes/${currentRouteId}`, 
          routeData, 
          getAuthHeader()
        );
      } else {
        // Create new route
        await axios.post(
          'http://localhost:5000/api/routes', 
          routeData, 
          getAuthHeader()
        );
      }
      
      // Reset form, close modal and refresh routes
      resetForm();
      setShowModal(false);
      fetchRoutes();
    } catch (err) {
      const actionType = isEditing ? 'update' : 'add';
      setError(`Failed to ${actionType} route: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => 
    route.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    route.routeNumber?.toString().includes(searchTerm.toLowerCase()) ||
    route.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format fare display considering the fare structure in schema
  const formatFare = (fare) => {
    if (!fare) return 'N/A';
    if (typeof fare === 'object') {
      return `${fare.regular} (Reg) / ${fare.student} (Stu) / ${fare.senior} (Sen)`;
    }
    return `${fare}`;
  };

  const exportRoutesToCSV = () => {
    // Prepare CSV header
    let csv = 'Route Number,Name,Type,Distance (km),Duration (min),Regular Fare,Student Fare,Senior Fare,Stops Count,Status\n';
    
    // Add route data
    filteredRoutes.forEach(route => {
      csv += `${route.routeNumber},`;
      csv += `${route.name},`;
      csv += `${route.type},`;
      csv += `${route.distance},`;
      csv += `${route.estimatedDuration},`;
      csv += `$${route.fare.regular},`;
      csv += `$${route.fare.student},`;
      csv += `$${route.fare.senior},`;
      csv += `${route.stops?.length || 0},`;
      csv += `${route.isActive ? 'Active' : 'Inactive'}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `routes_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Route Management</h1>
          <p className="mt-1 text-gray-600">Manage transit routes and stops.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button 
            onClick={exportRoutesToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiDownload className="-ml-1 mr-2 h-5 w-5" />
            Export Routes
          </button>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            Add New Route
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            className="absolute top-0 right-0 mt-3 mr-4" 
            onClick={() => setError(null)}
          >
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">All Routes</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search routes..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {routes.length === 0 ? 'No routes found.' : 'No matching routes found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.map((route) => (
                  <tr key={route._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <FiMap className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500">#{route.routeNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{route.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.distance} km</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.estimatedDuration} min</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFare(route.fare)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.stops?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                      <button
                        onClick={() => handleEditRoute(route._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        onClick={() => handleDeleteRoute(route._id)}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Route Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Route Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Route Number
                      </label>
                      <input
                        type="text"
                        name="routeNumber"
                        value={newRoute.routeNumber}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border ${formErrors.routeNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.routeNumber && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.routeNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Route Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newRoute.name}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Route Type
                      </label>
                      <select
                        name="type"
                        value={newRoute.type}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="bus">Bus</option>
                        <option value="train">Train</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Distance (km)
                      </label>
                      <input
                        type="number"
                        name="distance"
                        value={newRoute.distance}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        className={`mt-1 block w-full border ${formErrors.distance ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.distance && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.distance}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        name="estimatedDuration"
                        value={newRoute.estimatedDuration}
                        onChange={handleInputChange}
                        min="0"
                        className={`mt-1 block w-full border ${formErrors.estimatedDuration ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.estimatedDuration && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.estimatedDuration}</p>
                      )}
                    </div>
                  </div>

                  {/* Fare Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Fare Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Regular Fare ($)
                      </label>
                      <input
                        type="number"
                        name="fare.regular"
                        value={newRoute.fare.regular}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`mt-1 block w-full border ${formErrors.fareRegular ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.fareRegular && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fareRegular}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Student Fare ($)
                      </label>
                      <input
                        type="number"
                        name="fare.student"
                        value={newRoute.fare.student}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`mt-1 block w-full border ${formErrors.fareStudent ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.fareStudent && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fareStudent}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Senior Fare ($)
                      </label>
                      <input
                        type="number"
                        name="fare.senior"
                        value={newRoute.fare.senior}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`mt-1 block w-full border ${formErrors.fareSenior ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      />
                      {formErrors.fareSenior && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fareSenior}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stops Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Stops</h4>
                    {formErrors.stops && (
                      <p className="text-sm text-red-600">{formErrors.stops}</p>
                    )}
                  </div>

                  {/* Stop Form */}
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stop Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={stopForm.name}
                          onChange={handleStopInputChange}
                          className={`mt-1 block w-full border ${formErrors.stopName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                        />
                        {formErrors.stopName && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.stopName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estimated Arrival Time (minutes from start)
                        </label>
                        <input
                          type="number"
                          name="estimatedArrivalTime"
                          value={stopForm.estimatedArrivalTime}
                          onChange={handleStopInputChange}
                          min="0"
                          className={`mt-1 block w-full border ${formErrors.estimatedArrivalTime ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                        />
                        {formErrors.estimatedArrivalTime && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.estimatedArrivalTime}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Longitude
                        </label>
                        <input
                          type="text"
                          name="location.coordinates.0"
                          value={stopForm.location.coordinates[0]}
                          onChange={handleStopInputChange}
                          className={`mt-1 block w-full border ${formErrors.longitude ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="e.g. -73.9857"
                        />
                        {formErrors.longitude && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.longitude}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Latitude
                        </label>
                        <input
                          type="text"
                          name="location.coordinates.1"
                          value={stopForm.location.coordinates[1]}
                          onChange={handleStopInputChange}
                          className={`mt-1 block w-full border ${formErrors.latitude ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="e.g. 40.7484"
                        />
                        {formErrors.latitude && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.latitude}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addStop}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiPlus className="-ml-0.5 mr-2 h-4 w-4" />
                      Add Stop
                    </button>
                  </div>

                  {/* List of Added Stops */}
                  <div className="space-y-2">
                    {newRoute.stops.length > 0 ? (
                      newRoute.stops.map((stop, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                          <div>
                            <p className="font-medium">{stop.name}</p>
                            <p className="text-sm text-gray-500">
                              {stop.location.coordinates[0]}, {stop.location.coordinates[1]} • Arrival: {stop.estimatedArrivalTime} min
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStop(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No stops added yet</p>
                    )}
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Schedule</h4>
                    <button
                      type="button"
                      onClick={addSchedule}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiPlus className="-ml-0.5 mr-1 h-3 w-3" />
                      Add Day
                    </button>
                  </div>

                  {newRoute.schedule.map((daySchedule, scheduleIndex) => (
                    <div key={scheduleIndex} className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="w-full md:w-1/3">
                          <label className="block text-sm font-medium text-gray-700">
                            Day of Week
                          </label>
                          <select
                            value={daySchedule.dayOfWeek}
                            onChange={(e) => handleScheduleChange(scheduleIndex, 'dayOfWeek', parseInt(e.target.value))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value={0}>Sunday</option>
                            <option value={1}>Monday</option>
                            <option value={2}>Tuesday</option>
                            <option value={3}>Wednesday</option>
                            <option value={4}>Thursday</option>
                            <option value={5}>Friday</option>
                            <option value={6}>Saturday</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSchedule(scheduleIndex)}
                          className="text-red-500 hover:text-red-700 mt-6"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h5 className="text-sm font-medium text-gray-700">Departure Times (HH:MM)</h5>
                          <button
                            type="button"
                            onClick={() => addDepartureTime(scheduleIndex)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <FiPlus className="-ml-0.5 mr-1 h-3 w-3" />
                            Add Time
                          </button>
                        </div>

                        {daySchedule.departureTimesFromOrigin.map((time, timeIndex) => (
                          <div key={timeIndex} className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => handleDepartureTimeChange(scheduleIndex, timeIndex, e.target.value)}
                              className="block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => removeDepartureTime(scheduleIndex, timeIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : isEditing ? 'Update Route' : 'Save Route'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;



