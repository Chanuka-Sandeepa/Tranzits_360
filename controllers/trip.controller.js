import asyncHandler from 'express-async-handler';
import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private/Admin
export const getAllTrips = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('route', 'routeNumber name')
      .populate('vehicle', 'vehicleNumber vehicleType')
      .populate('driver', 'firstName lastName'); // driver field references User model
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trips'
    });
  }
});

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private
export const getTripById = asyncHandler(async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('route', 'routeNumber name type stops schedule')
      .populate('vehicle', 'vehicleNumber vehicleType capacity features')
      .populate('driver', 'firstName lastName phone'); // driver field references User model
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error fetching trip by ID:', error);
    res.status(500).json({
      success: false, 
      message: 'Server error while fetching trip details'
    });
  }
});

// @desc    Schedule new trip
// @route   POST /api/trips
// @access  Private/Admin
export const scheduleTrip = asyncHandler(async (req, res) => {
  try {
    // Validate input
    const { routeId, vehicleId, driverId, startTime } = req.body;
    if (!routeId || !vehicleId || !driverId || !startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Verify the driver exists (it's actually a User with driver role)
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    // Optionally validate if user has driver role
    if (driver.role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'Selected user is not a driver'
      });
    }

    // Create basic trip
    const trip = await Trip.create({
      route: routeId,
      vehicle: vehicleId,
      driver: driverId,
      startTime: new Date(startTime),
      status: 'scheduled'
    });

    // Safe population with error handling
    try {
      const populated = await Trip.findById(trip._id)
        .populate({
          path: 'route',
          select: 'routeNumber name',
          model: 'Route'
        })
        .populate({
          path: 'vehicle',
          select: 'vehicleNumber vehicleType',
          model: 'Vehicle'
        })
        .populate({
          path: 'driver',
          select: 'firstName lastName',
          model: 'User' // Explicitly specify User model
        })
        .lean();

      return res.status(201).json({
        success: true,
        data: populated
      });
    } catch (populateError) {
      console.error('Population failed but trip created:', populateError);
      return res.status(201).json({
        success: true,
        data: trip,
        warning: 'Reference population failed'
      });
    }
    
  } catch (error) {
    console.error('Trip creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// @desc    Update trip status
// @route   PUT /api/trips/:id/status
// @access  Private/Driver,Admin
export const updateTripStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status'
      });
    }
    
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Check if the user is either the assigned driver or an admin
    if (trip.driver.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this trip'
      });
    }
    
    // Update status
    trip.status = status;
    
    // If status is completed, set end time
    if (status === 'completed') {
      trip.endTime = new Date();
    }
    
    await trip.save();
    
    res.status(201).json({
      success: true,
      data: {
        id: trip._id,
        status: trip.status,
        updatedAt: trip.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating trip status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating trip status'
    });
  }
});

// @desc    Update trip location
// @route   PUT /api/trips/:id/location
// @access  Private/Driver
export const updateTripLocation = asyncHandler(async (req, res) => {
  try {
    const { coordinates, speed, passengerCount, delay, stopUpdate } = req.body;
    
    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid coordinates [longitude, latitude]'
      });
    }
    
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Check if the user updating is the assigned driver
    if (trip.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this trip'
      });
    }
    
    // Update trip location
    trip.currentLocation = {
      type: 'Point',
      coordinates: coordinates
    };
    
    // Update vehicle location as well
    await Vehicle.findByIdAndUpdate(
      trip.vehicle,
      { 
        'currentLocation.coordinates': coordinates,
        'currentLocation.type': 'Point'
      },
      { new: true }
    );
    
    // Update other fields if provided
    if (speed !== undefined) trip.currentSpeed = speed;
    if (passengerCount !== undefined) trip.passengerCount = passengerCount;
    if (delay !== undefined) trip.delay = delay;
    
    // Add stop update if provided
    if (stopUpdate) {
      trip.stopUpdates.push({
        ...stopUpdate,
        actualArrivalTime: new Date()
      });
    }
    
    await trip.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: trip._id,
        location: trip.currentLocation,
        speed: trip.currentSpeed,
        passengerCount: trip.passengerCount,
        delay: trip.delay,
        updatedAt: trip.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating trip location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating trip location'
    });
  }
});

// @desc    Report incident during trip
// @route   POST /api/trips/:id/incident
// @access  Private/Driver
export const reportIncident = asyncHandler(async (req, res) => {
  try {
    const { type, description } = req.body;
    
    // Validate incident type
    const validTypes = ['delay', 'accident', 'breakdown', 'other'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid incident type'
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide incident description'
      });
    }
    
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Check if the user reporting is the assigned driver
    if (trip.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to report incidents for this trip'
      });
    }
    
    // Add incident
    trip.incidents.push({
      type,
      description,
      time: new Date(),
      resolved: false
    });
    
    await trip.save();
    
    res.status(201).json({
      success: true,
      data: {
        id: trip._id,
        incidents: trip.incidents,
        updatedAt: trip.updatedAt
      }
    });
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting incident'
    });
  }
});

// @desc    Get active trips
// @route   GET /api/trips/active
// @access  Public
export const getActiveTrips = asyncHandler(async (req, res) => {
  try {
    const { routeId, vehicleType } = req.query;
    
    let query = { status: 'in-progress' };
    
    if (routeId) {
      query.route = routeId;
    }
    
    const trips = await Trip.find(query)
      .populate('route', 'routeNumber name type')
      .populate('vehicle', 'vehicleNumber vehicleType')
      .populate('driver', 'firstName lastName'); // driver field references User model
    
    // If filtering by vehicle type
    if (vehicleType && ['bus', 'train'].includes(vehicleType)) {
      const filteredTrips = trips.filter(trip => 
        trip.vehicle?.vehicleType === vehicleType
      );
      
      return res.status(200).json({
        success: true,
        count: filteredTrips.length,
        data: filteredTrips
      });
    }
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching active trips:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active trips'
    });
  }
});

// @desc    Get trips by driver
// @route   GET /api/trips/driver
// @access  Private/Driver
export const getTripsByDriver = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let query = { driver: req.user.id };
    
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('route', 'routeNumber name type stops')
      .populate('vehicle', 'vehicleNumber vehicleType')
      .sort({ startTime: -1 });
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching driver trips'
    });
  }
});

// @desc    Get trips by route
// @route   GET /api/trips/route/:routeId
// @access  Public
export const getTripsByRoute = asyncHandler(async (req, res) => {
  try {
    const { date, status } = req.query;
    
    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date();
    
    // Set date range for the full day
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));
    
    let query = { 
      route: req.params.routeId,
      startTime: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };
    
    if (status) {
      query.status = status;
    }
    
    const trips = await Trip.find(query)
      .populate('vehicle', 'vehicleNumber vehicleType')
      .populate('driver', 'firstName lastName') // driver field references User model
      .sort({ startTime: 1 });
    
    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Error fetching route trips:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching route trips'
    });
  }
});

// @desc    Delete a trip by ID
// @route   DELETE /api/trips/:id
// @access  Private/Admin
export const deleteTripById = asyncHandler(async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting trip'
    });
  }
});

// @desc    Update trip details
// @route   PUT /api/trips/:id
// @access  Private/Admin
export const updateTrip = asyncHandler(async (req, res) => {
  try {
    const { routeId, vehicleId, driverId, startTime, status } = req.body;
    
    // Find the trip
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }
    
    // Update fields if provided
    if (routeId) trip.route = routeId;
    if (vehicleId) trip.vehicle = vehicleId;
    if (driverId) trip.driver = driverId;
    if (startTime) trip.startTime = new Date(startTime);
    if (status) trip.status = status;
    
    // Save the updated trip
    await trip.save();
    
    // Populate the updated trip
    const updatedTrip = await Trip.findById(trip._id)
      .populate('route', 'routeNumber name')
      .populate('vehicle', 'vehicleNumber vehicleType')
      .populate('driver', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      data: updatedTrip
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating trip'
    });
  }
});