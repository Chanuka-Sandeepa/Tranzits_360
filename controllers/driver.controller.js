import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Trip from '../models/Trip.js';

// @desc    Get driver profile
// @route   GET /api/driver/profile
// @access  Private/Driver
export const getDriverProfile = asyncHandler(async (req, res) => {
  const driver = await User.findById(req.user.id).select('-password');
  
  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Update driver profile
// @route   PUT /api/driver/profile
// @access  Private/Driver
export const updateDriverProfile = asyncHandler(async (req, res) => {
  // Fields to allow updating
  const allowedFields = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    licenseExpiry: req.body.licenseExpiry,
    isAvailable: req.body.isAvailable
  };
  
  // Remove undefined fields
  Object.keys(allowedFields).forEach(
    key => allowedFields[key] === undefined && delete allowedFields[key]
  );
  
  const driver = await User.findByIdAndUpdate(
    req.user.id,
    allowedFields,
    { new: true, runValidators: true }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: driver
  });
});

// @desc    Get driver's vehicles
// @route   GET /api/driver/vehicles
// @access  Private/Driver
export const getDriverVehicles = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ driver: req.user.id })
    .populate('routes', 'routeNumber name type')
    .populate('currentRoute', 'routeNumber name type');
  
  res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
  });
});

// @desc    Update vehicle status
// @route   PATCH /api/driver/vehicles/:id/status
// @access  Private/Driver
export const updateVehicleStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  if (!['active', 'maintenance', 'out-of-service'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }
  
  let vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  // Verify the driver is assigned to this vehicle
  if (vehicle.driver.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to update this vehicle'
    });
  }
  
  vehicle.status = status;
  await vehicle.save();
  
  res.status(200).json({
    success: true,
    data: vehicle
  });
});

// @desc    Get driver's trips
// @route   GET /api/driver/trips
// @access  Private/Driver
export const getDriverTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ driver: req.user.id })
    .populate('route', 'routeNumber name type')
    .populate('vehicle', 'vehicleNumber vehicleType')
    .sort({ startTime: -1 });
  
  res.status(200).json({
    success: true,
    count: trips.length,
    data: trips
  });
});

// @desc    Update driver location
// @route   PATCH /api/driver/location
// @access  Private/Driver
export const updateDriverLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;
  
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid coordinates [longitude, latitude]'
    });
  }
  
  // Update driver location
  const driver = await User.findByIdAndUpdate(
    req.user.id,
    {
      'currentLocation.coordinates': coordinates
    },
    { new: true }
  ).select('-password');
  
  // Also update active trip location if there is one
  const activeTrip = await Trip.findOne({
    driver: req.user.id,
    status: 'in-progress'
  });
  
  if (activeTrip) {
    activeTrip.currentLocation.coordinates = coordinates;
    await activeTrip.save();
  }
  
  res.status(200).json({
    success: true,
    data: {
      location: driver.currentLocation,
      updatedAt: new Date()
    }
  });
});
