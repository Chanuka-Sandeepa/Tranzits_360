import express from 'express';
import { 
  register, 
  login, 
  getMe, 
  registerAdmin, 
  logout, 
  updateProfile,
  deleteAccount,
  getTotalUsers
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/register-admin', registerAdmin);
router.get('/total-users', getTotalUsers);

// Protected Routes
router.get('/me', protect, getMe);  // Get logged-in user details
router.put('/update-profile', protect, updateProfile); // Update user profile based on role
router.post('/logout', protect, logout);
router.delete('/delete-account', protect, deleteAccount);

export default router;
