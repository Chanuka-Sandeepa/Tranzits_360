import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName, phone, idNumber } = req.body;

  if (!email || !password || !firstName || !lastName || !phone || !idNumber) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = await User.create({ email, password, role, firstName, lastName, phone, idNumber });
  const token = generateToken(user._id, user.role);

  res.status(201).json({ success: true, token, user });
});

// @desc    Register admin
// @route   POST /api/auth/register-admin
// @access  Public (with admin key)
export const registerAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, adminKey, idNumber } = req.body;

    // Validate admin key
    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(401).json({ success: false, message: 'Invalid admin registration key' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create new admin user with idNumber
    const user = await User.create({ 
      email, 
      password, 
      role: 'admin', 
      firstName, 
      lastName, 
      phone,
      idNumber: idNumber || `ADMIN-${Date.now()}` // Provide a default if not supplied
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Send success response
    res.status(201).json({ success: true, token, user });
    
  } catch (error) {
    console.error('Admin registration error:', error);
    
    // Return specific validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false, 
        message: 'Validation Error',
        errors: messages
      });
    }
    
    // Return generic server error
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken(user._id, user.role);
  
  // Create a user object without the password
  const userResponse = user.toObject();
  delete userResponse.password;

  // Return the response
  res.status(200).json({ 
    success: true, 
    token, 
    user: userResponse
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.status(200).json({ success: true, user });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Delete account
// @route   DELETE /api/auth/delete
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await User.findByIdAndDelete(req.user.id);
  res.status(200).json({ success: true, message: 'Account deleted successfully' });
});

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName, phone, homeAddress, workAddress, licenseNumber, licenseExpiry } = req.body;
    const userId = req.user.id;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update common fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    
    // Update role-specific fields
    if (user.role === 'passenger') {
      // Passenger-specific updates
      if (homeAddress !== undefined) {
        // Convert string to object format if needed
        if (typeof homeAddress === 'string') {
          user.homeAddress = { 
            address: homeAddress 
          };
        } else {
          // If it's already an object, use it directly
          user.homeAddress = homeAddress;
        }
      }
      
      if (workAddress !== undefined) {
        // Convert string to object format if needed
        if (typeof workAddress === 'string') {
          user.workAddress = { 
            address: workAddress 
          };
        } else {
          // If it's already an object, use it directly
          user.workAddress = workAddress;
        }
      }
    }
    
    if (user.role === 'driver') {
      // Driver-specific updates
      if (licenseNumber !== undefined) {
        user.licenseNumber = licenseNumber;
      }
      if (licenseExpiry !== undefined) {
        user.licenseExpiry = licenseExpiry;
      }
    }
    
    // Save the updated user data
    await user.save();
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        homeAddress: user.homeAddress,
        workAddress: user.workAddress,
        licenseNumber: user.licenseNumber,
        licenseExpiry: user.licenseExpiry,
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export const getTotalUsers = asyncHandler(async (req, res) => {
  try{
    const totalUsers = await User.countDocuments();
    res.status(200).json({ success: true, totalUsers });
  }catch (error) {
    console.error('Error fetching total users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }

});