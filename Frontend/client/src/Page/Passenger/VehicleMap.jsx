import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle icon
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export default function VehicleMap({ vehicles }) {
  // Default center to Colombo, Sri Lanka
  const defaultCenter = [6.9271, 79.8612];
  
  // Function to get route color based on vehicle type
  const getRouteColor = (vehicleType) => {
    return vehicleType === 'bus' ? '#2563eb' : '#7c3aed';
  };

  // Function to get route opacity based on whether it's the current route
  const getRouteOpacity = (isCurrentRoute) => {
    return isCurrentRoute ? 0.8 : 0.4;
  };
  
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {vehicles && vehicles.map((vehicle) => {
          if (!vehicle.currentLocation?.coordinates) {
            return null;
          }

          // Render route if available
          const routeElements = [];
          if (vehicle.routes && vehicle.routes.length > 0) {
            vehicle.routes.forEach(route => {
              if (route.path && route.path.length > 1) {
                const isCurrentRoute = vehicle.currentRoute?._id === route._id;
                routeElements.push(
                  <Polyline
                    key={`${vehicle._id}-${route._id}`}
                    positions={route.path.map(point => [point.lat, point.lng])}
                    color={getRouteColor(vehicle.vehicleType)}
                    weight={3}
                    opacity={getRouteOpacity(isCurrentRoute)}
                    dashArray={isCurrentRoute ? null : '5, 10'}
                  />
                );
              }
            });
          }

          return (
            <React.Fragment key={vehicle._id}>
              {routeElements}
              <Marker
                position={[
                  vehicle.currentLocation.coordinates[1],
                  vehicle.currentLocation.coordinates[0]
                ]}
                icon={vehicleIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">Vehicle {vehicle.vehicleNumber}</div>
                    <div className="text-gray-500">
                      {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)}
                    </div>
                    {vehicle.currentRoute && (
                      <div className="mt-1 text-gray-500">
                        Route: {vehicle.currentRoute.routeNumber} - {vehicle.currentRoute.name}
                      </div>
                    )}
                    {vehicle.currentLocation && (
                      <div className="mt-1 text-gray-500">
                        Last Updated: {new Date(vehicle.currentLocation.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
} 