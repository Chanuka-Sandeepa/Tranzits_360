import { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function VehicleTracker({ vehicleId }) {
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextStop = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/next-stop`);
        setTrackingData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch tracking data');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNextStop();

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchNextStop, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 flex items-start">
        <AlertCircle className="text-red-500 mr-2 mt-0.5" size={18} />
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  if (!trackingData) {
    return null;
  }

  // If route is completed
  if (trackingData.message === 'Route completed for this trip') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center text-gray-600">
          <MapPin className="mr-2" size={18} />
          <span>Route completed</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Last updated: {new Date(trackingData.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  // Format ETA
  const formatETA = (minutes) => {
    if (minutes < 1) return 'Arriving now';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center text-gray-900 font-medium">
            <MapPin className="mr-2 text-blue-600" size={18} />
            <span>{trackingData.nextStop.name}</span>
          </div>
          
          <div className="mt-2 flex items-center text-gray-600">
            <Clock className="mr-2" size={16} />
            <span>
              Arriving at {new Date(trackingData.nextStop.scheduledArrivalTime).toLocaleTimeString()}
            </span>
          </div>

          <div className="mt-2 flex items-center text-blue-600">
            <Navigation className="mr-2" size={16} />
            <span>ETA: {formatETA(trackingData.nextStop.etaMinutes)}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">
            Last updated
          </div>
          <div className="text-sm text-gray-600">
            {new Date(trackingData.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Location coordinates */}
      <div className="mt-4 text-xs text-gray-500">
        Current Location: [
          {trackingData.currentLocation.coordinates[1].toFixed(6)},
          {trackingData.currentLocation.coordinates[0].toFixed(6)}
        ]
      </div>
    </div>
  );
} 