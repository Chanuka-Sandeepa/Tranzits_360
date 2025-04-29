import express from 'express';
import { 
  getUsers, 
  getDrivers, 
  getPassengers, 
  deleteUser 
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Admin routes
router.get('/users', getUsers);
router.get('/drivers', getDrivers);
router.get('/passengers', getPassengers);
router.delete('/users/:id', deleteUser);

export default router;