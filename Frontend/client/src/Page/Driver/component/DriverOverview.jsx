// src/pages/component/driver/DriverOverview.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiClock, FiMapPin, FiTruck,
  FiCreditCard, FiTrendingUp, FiUsers, FiStar
} from 'react-icons/fi';

const DriverOverview = ({ isLoading, activeTrip, upcomingTrips, stats }) => {
  const [timeNow, setTimeNow] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeNow(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format date display
  const formatDateHeader = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section with date and time */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome back, Driver</h1>
            <p className="text-gray-500 mt-1">{formatDateHeader(timeNow)} — {formatTime(timeNow)}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/driver/dashboard/checklist"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiTruck className="mr-2" />
              Vehicle Checklist
            </Link>
          </div>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-blue-100">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Trips Completed</h2>
              <p className="text-xl font-semibold text-gray-800">{stats.tripsCompleted}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-green-100">
              <FiMapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Total Distance</h2>
              <p className="text-xl font-semibold text-gray-800">{stats.totalDistance} km</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-yellow-100">
              <FiStar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Average Rating</h2>
              <p className="text-xl font-semibold text-gray-800">{stats.averageRating.toFixed(1)} / 5.0</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md p-3 bg-purple-100">
              <FiClock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-gray-500">Hours This Week</h2>
              <p className="text-xl font-semibold text-gray-800">{stats.hoursWorkedThisWeek}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active trip card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-800">Current Trip</h2>
        </div>
        
        <div className="p-6">
          {activeTrip ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center text-blue-700">
                    <FiTruck className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Trip #{activeTrip.id}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-gray-800">
                    {activeTrip.route.startLocation} → {activeTrip.route.endLocation}
                  </h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiCalendar className="h-4 w-4 mr-1" />
                      <span>{activeTrip.startTime}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <FiUsers className="h-4 w-4 mr-1" />
                      <span>{activeTrip.passengerCount} passengers</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link
                    to={`/driver/dashboard/trips/${activeTrip.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Trip</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any active trips right now.</p>
              <div className="mt-6">
                <Link
                  to="/driver/dashboard/trips"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  View Upcoming Trips
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming trips */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-800">Upcoming Trips</h2>
          <Link
            to="/driver/dashboard/trips"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {upcomingTrips.length > 0 ? (
            upcomingTrips.map((trip) => (
              <div key={trip.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      {trip.route.startLocation} → {trip.route.endLocation}
                    </h3>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <FiCalendar className="h-4 w-4 mr-1" />
                        <span>{trip.startTime}</span>
                      </div>
                      <div className="flex items-center">
                        <FiCreditCard className="h-4 w-4 mr-1" />
                        <span>{trip.vehicle.type} - {trip.vehicle.licensePlate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Link
                      to={`/driver/dashboard/trips/${trip.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FiClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Upcoming Trips</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any upcoming trips scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverOverview;