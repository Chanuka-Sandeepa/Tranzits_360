import { broadcastToAll, sendToClient } from './websocket-server.js';
import { updateClientMetadata } from './client-manager.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

// In-memory storage for real-time location data
const locationStore = new Map();

/**
 * Handle location update from a client
 * @param {string} clientId - Client ID that sent the update
 * @param {Object} locationData - Location data
 */
async function handleLocationUpdate(clientId, locationData) {
  try {
    if (!isValidLocationData(locationData)) {
      sendToClient(clientId, {
        type: 'error',
        message: 'Invalid location data format',
        timestamp: Date.now(),
      });
      return;
    }

    const locationInfo = {
      clientId,
      timestamp: Date.now(),
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy || 0,
        speed: locationData.speed || 0,
        heading: locationData.heading || 0,
      },
      metadata: locationData.metadata || {},
    };

    locationStore.set(clientId, locationInfo);
    updateClientMetadata(clientId, {
      lastLocation: locationInfo.location,
      lastUpdated: locationInfo.timestamp,
    });

    broadcastToAll({
      type: 'locationUpdate',
      data: locationInfo,
    });

    if (locationData.vehicleId) {
      await updateVehicleLocation(locationData.vehicleId, locationData.driverId, locationInfo.location);
    }
  } catch (error) {
    console.error('Error handling location update:', error);
    sendToClient(clientId, {
      type: 'error',
      message: 'Failed to process location update',
      timestamp: Date.now(),
    });
  }
}

function isValidLocationData(data) {
  return (
    data &&
    typeof data.latitude === 'number' &&
    typeof data.longitude === 'number' &&
    data.latitude >= -90 &&
    data.latitude <= 90 &&
    data.longitude >= -180 &&
    data.longitude <= 180
  );
}

async function updateVehicleLocation(vehicleId, driverId, location) {
  try {
    if (vehicleId) {
      await Vehicle.findByIdAndUpdate(vehicleId, {
        currentLocation: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        lastLocationUpdate: new Date(),
        speed: location.speed,
        heading: location.heading,
      });
    }

    if (driverId) {
      await Driver.findByIdAndUpdate(driverId, {
        lastLocation: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        lastLocationUpdate: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating location in database:', error);
  }
}

function getAllLocations() {
  return Array.from(locationStore.values());
}

function getLocationByClientId(clientId) {
  return locationStore.get(clientId);
}

function cleanupLocationStore(maxAgeMs = 30 * 60 * 1000) {
  const now = Date.now();
  locationStore.forEach((locationInfo, clientId) => {
    if (now - locationInfo.timestamp > maxAgeMs) {
      locationStore.delete(clientId);
    }
  });
}

setInterval(cleanupLocationStore, 10 * 60 * 1000);

export { handleLocationUpdate, getAllLocations, getLocationByClientId };
