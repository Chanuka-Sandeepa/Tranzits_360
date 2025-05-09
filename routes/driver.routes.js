import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

// Import controller functions
import {
  getDriverProfile,
  updateDriverProfile,
  getDriverVehicles,
  getDriverTrips,
  updateDriverLocation,
  updateVehicleStatus
} from '../controllers/driver.controller.js';

const router = express.Router();

// Apply authentication middleware
router.use(protect);
router.use(authorize('driver'));

// Driver profile routes
router.route('/profile')
  .get(getDriverProfile)
  .put(updateDriverProfile);

// Driver vehicle routes
router.get('/vehicles', getDriverVehicles);
router.patch('/vehicles/:id/status', updateVehicleStatus);

// Driver trip routes
router.get('/trips', getDriverTrips);
router.patch('/location', updateDriverLocation);

export default router;
