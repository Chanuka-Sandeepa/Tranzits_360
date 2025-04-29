import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer header
    token = req.headers.authorization.split(' ')[1];
  } 
  // Optionally check for token in cookies if you're using them
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // If no token found
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object (without password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
});

// Rest of your code...


// Restrict to specific roles (admin, driver, passenger)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Flatten the roles array in case it's nested
    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.role} is not authorized to access this resource` 
      });
    }

    next();
  };
};
