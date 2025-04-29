import express from 'express';
import {
  getAllVehicles,
  getVehicleById,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleLocation,
  assignRoutes,
  assignCurrentRoute,
  getVehiclesByRoute,
  getActiveVehiclesOnRoute
} from '../controllers/vehicle.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import config from '../config/config.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Admin-only routes
router.route('/')
  .get(authorize(['admin', 'driver']), getAllVehicles)
  .post(authorize('admin'), addVehicle);

router.route('/:id')
  .get(authorize(['admin', 'driver']), getVehicleById)
  .put(authorize('admin'), updateVehicle)
  .delete(authorize('admin'), deleteVehicle);

// Route assignments (Admin only)
router.put('/:id/routes', authorize('admin'), assignRoutes);
router.put('/:id/current-route', authorize('admin'), assignCurrentRoute);

// Driver-only route
router.put('/:id/location', authorize('driver'), updateVehicleLocation);

// Get vehicles by route (Admin only)
router.get('/route/:routeId', authorize(['admin', 'driver']), getVehiclesByRoute);
router.get('/active-route/:routeId', authorize(['admin', 'driver']), getActiveVehiclesOnRoute);

export default router;
