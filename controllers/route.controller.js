import asyncHandler from 'express-async-handler';
import Route from '../models/Route.js';

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
export const getAllRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find({ isActive: true });
  
  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});

// @desc    Get route by ID
// @route   GET /api/routes/:id
// @access  Public
export const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Add new route
// @route   POST /api/routes
// @access  Private/Admin
export const addRoute = asyncHandler(async (req, res) => {
  try {
    const {
      routeNumber,
      name,
      type,
      stops,
      distance,
      estimatedDuration,
      fare,
      schedule
    } = req.body;

    // Check if route number already exists
    const routeExists = await Route.findOne({ routeNumber });
    if (routeExists) {
      return res.status(400).json({
        success: false,
        message: 'Route with this number already exists'
      });
    }

    // Validate route type
    if (type !== 'bus' && type !== 'train') {
      return res.status(400).json({
        success: false,
        message: 'Route type must be either "bus" or "train"'
      });
    }

    // Create the route
    const route = await Route.create({
      routeNumber,
      name,
      type,
      stops,
      distance,
      estimatedDuration,
      fare,
      schedule
    });

    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error adding route:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private/Admin
export const updateRoute = asyncHandler(async (req, res) => {
  let route = await Route.findById(req.params.id);
  
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  route = await Route.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: route
  });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
export const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  
  // Soft delete (mark as inactive)
  route.isActive = false;
  await route.save();
  
  res.status(200).json({
    success: true,
    message: 'Route deactivated successfully'
  });
});

// @desc    Find routes near location
// @route   GET /api/routes/near
// @access  Public
export const findRoutesNearLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 1000 } = req.query; // maxDistance in meters
  
  if (!longitude || !latitude) {
    return res.status(400).json({
      success: false,
      message: 'Please provide longitude and latitude'
    });
  }
  
  // Find routes with stops near the provided location
  const routes = await Route.find({
    isActive: true,
    'stops.location': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseInt(maxDistance)
      }
    }
  });
  
  res.status(200).json({
    success: true,
    count: routes.length,
    data: routes
  });
});
