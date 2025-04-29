import asyncHandler from 'express-async-handler';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/User.js';
import Route from '../models/Route.js';

export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate({ path: "driver", model: "User", select: "name email" })
      .populate({ path: "routes", model: "Route", select: "name from to stops" })
      .populate({ path: "currentRoute", model: "Route", select: "name from to stops" });

    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate({ path: 'driver', model: 'User', select: 'firstName lastName phone' })
    .populate({ path: 'routes', model: 'Route', select: 'routeName startLocation endLocation' })
    .populate({ path: 'currentRoute', model: 'Route', select: 'routeName startLocation endLocation' });

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  res.status(200).json({
    success: true,
    data: vehicle
  });
});

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Private/Admin
export const addVehicle = asyncHandler(async (req, res) => {
  try {
    const { 
      vehicleNumber, 
      vehicleType, 
      capacity, 
      driver: driverId,
      routes: routeIds,
      currentRoute: currentRouteId,
      nextMaintenanceDue,
      features
    } = req.body;
    
    // Check if driver exists
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Check if vehicle number already exists
    const vehicleExists = await Vehicle.findOne({ vehicleNumber });
    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number already exists'
      });
    }
    
    // Validate routes if provided
    if (routeIds && routeIds.length > 0) {
      const routesExist = await Route.countDocuments({
        _id: { $in: routeIds }
      });
      
      if (routesExist !== routeIds.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more routes not found'
        });
      }
    }
    
    // Validate current route if provided
    if (currentRouteId) {
      const routeExists = await Route.findById(currentRouteId);
      if (!routeExists) {
        return res.status(404).json({
          success: false,
          message: 'Current route not found'
        });
      }
      
      // Check if current route is in the routes array
      if (routeIds && !routeIds.includes(currentRouteId)) {
        return res.status(400).json({
          success: false,
          message: 'Current route must be included in the routes array'
        });
      }
    }
    
    const vehicle = await Vehicle.create({
      vehicleNumber,
      vehicleType,
      capacity,
      driver: driverId,
      routes: routeIds || [],
      currentRoute: currentRouteId || null,
      nextMaintenanceDue,
      features: features || {}
    });
    
    // Return the created vehicle without population to avoid potential errors
    res.status(201).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error in addVehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
export const updateVehicle = asyncHandler(async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    
    // 1. Check if vehicle exists
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // 2. Validate driver if provided
    if (req.body.driver) {
      const driver = await Driver.findById(req.body.driver);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }
    }

    // 3. Validate routes if provided
    if (req.body.routes && req.body.routes.length > 0) {
      const routesExist = await Route.countDocuments({
        _id: { $in: req.body.routes }
      });
      
      if (routesExist !== req.body.routes.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more routes not found'
        });
      }
    }

    // 4. Validate current route if provided
    if (req.body.currentRoute) {
      const routeExists = await Route.findById(req.body.currentRoute);
      if (!routeExists) {
        return res.status(404).json({
          success: false,
          message: 'Current route not found'
        });
      }

      // Check if the current route is part of the routes array (if updating routes)
      if (req.body.routes && !req.body.routes.includes(req.body.currentRoute)) {
        return res.status(400).json({
          success: false,
          message: 'Current route must be included in the routes array'
        });
      }

      // If routes are not being updated, ensure the current route is part of the vehicle's existing routes
      if (!req.body.routes && vehicle.routes && !vehicle.routes.some(route => route.toString() === req.body.currentRoute)) {
        return res.status(400).json({
          success: false,
          message: 'Current route must be included in the vehicle\'s routes'
        });
      }
    }

    // 5. Update the vehicle without population first
    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // 6. Return updated vehicle data
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});


// @desc    Assign routes to vehicle
// @route   PUT /api/vehicles/:id/routes
// @access  Private/Admin
export const assignRoutes = asyncHandler(async (req, res) => {
  const { routes: routeIds } = req.body;
  
  if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of route IDs'
    });
  }
  
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  // Verify all routes exist
  const routesExist = await Route.countDocuments({
    _id: { $in: routeIds }
  });
  
  if (routesExist !== routeIds.length) {
    return res.status(404).json({
      success: false,
      message: 'One or more routes not found'
    });
  }
  
  // Update the vehicle's routes
  vehicle.routes = routeIds;
  
  // If current route is set but not in the new routes array, clear it
  if (vehicle.currentRoute && !routeIds.includes(vehicle.currentRoute.toString())) {
    vehicle.currentRoute = null;
  }
  
  await vehicle.save();
  
  const updatedVehicle = await Vehicle.findById(req.params.id)
    .populate('driver', 'firstName lastName phone')
    .populate('routes', 'routeName startLocation endLocation')
    .populate('currentRoute', 'routeName startLocation endLocation');
  
  res.status(200).json({
    success: true,
    data: updatedVehicle
  });
});

// @desc    Assign current route to vehicle
// @route   PUT /api/vehicles/:id/current-route
// @access  Private/Admin
export const assignCurrentRoute = asyncHandler(async (req, res) => {
  const { routeId } = req.body;
  
  if (!routeId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a route ID'
    });
  }
  
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  // Verify route exists
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Check if route is in the vehicle's routes array
  if (!vehicle.routes.includes(routeId)) {
    // Add to routes if not already there
    vehicle.routes.push(routeId);
  }
  
  // Set current route
  vehicle.currentRoute = routeId;
  
  await vehicle.save();
  
  const updatedVehicle = await Vehicle.findById(req.params.id)
    .populate('driver', 'firstName lastName phone')
    .populate('routes', 'routeName startLocation endLocation')
    .populate('currentRoute', 'routeName startLocation endLocation');
  
  res.status(200).json({
    success: true,
    data: updatedVehicle
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  await Vehicle.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'Vehicle removed successfully'
  });
});

// @desc    Update vehicle location
// @route   PUT /api/vehicles/:id/location
// @access  Private/Driver
export const updateVehicleLocation = asyncHandler(async (req, res) => {
  const { coordinates, speed } = req.body;
  
  // Validate coordinates
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid coordinates [longitude, latitude]'
    });
  }
  
  let vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  // Check if the driver updating is assigned to this vehicle
  if (vehicle.driver.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to update this vehicle\'s location'
    });
  }
  
  // Update location
  vehicle.currentLocation.coordinates = coordinates;
  
  // Update speed if provided
  if (speed !== undefined) {
    vehicle.currentSpeed = speed;
  }
  
  await vehicle.save();
  
  res.status(200).json({
    success: true,
    data: {
      id: vehicle._id,
      location: vehicle.currentLocation,
      updatedAt: new Date()
    }
  });
});

// @desc    Get vehicles by route
// @route   GET /api/vehicles/route/:routeId
// @access  Private/Admin
export const getVehiclesByRoute = asyncHandler(async (req, res) => {
  const { routeId } = req.params;
  
  // Verify route exists
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Find vehicles assigned to this route
  const vehicles = await Vehicle.find({
    routes: routeId
  })
    .populate('driver', 'firstName lastName phone')
    .populate('routes', 'routeName startLocation endLocation')
    .populate('currentRoute', 'routeName startLocation endLocation');
  
  res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
  });
});

// @desc    Get vehicles currently on a specific route
// @route   GET /api/vehicles/active-route/:routeId
// @access  Private/Admin
export const getActiveVehiclesOnRoute = asyncHandler(async (req, res) => {
  const { routeId } = req.params;
  
  // Verify route exists
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Find active vehicles currently on this route
  const vehicles = await Vehicle.find({
    currentRoute: routeId,
    status: 'active'
  })
    .populate('driver', 'firstName lastName phone')
    .populate('routes', 'routeName startLocation endLocation')
    .populate('currentRoute', 'routeName startLocation endLocation');
  
  res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
  });
});