import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private/Admin
export const getDrivers = asyncHandler(async (req, res) => {
  try {
    // Query users with role 'driver'
    const drivers = await User.find({ role: 'driver' })
      .select('-password');
    
    return res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get all passengers
// @route   GET /api/admin/passengers
// @access  Private/Admin
export const getPassengers = asyncHandler(async (req, res) => {
  try {
    const passengers = await User.find({ role: 'passenger' }).select(
      'email firstName lastName phone homeAddress workAddress paymentMethods preferredDrivers'
    );
    
    res.status(200).json({
      success: true,
      count: passengers.length,
      data: passengers
    });
  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Delete user directly since role-specific data is embedded in the User model
  await User.findByIdAndDelete(req.params.id);
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});