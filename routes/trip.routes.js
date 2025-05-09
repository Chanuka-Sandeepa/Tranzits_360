import express from 'express';
import {
  getAllTrips,
  getTripById,
  scheduleTrip,
  updateTripStatus,
  updateTripLocation,
  reportIncident,
  getActiveTrips,
  getTripsByDriver,
  getTripsByRoute,
  deleteTripById,
  updateTrip
} from '../controllers/trip.controller.js';
import { protect } from '../middleware/auth.js';
import roleCheck from '../middleware/roleCheck.js';
import config from '../config/config.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveTrips);
router.get('/route/:routeId', getTripsByRoute);

// Protected routes
router.use(protect);

// Admin routes
router
  .route('/')
  .get(roleCheck(config.ROLES.ADMIN), getAllTrips)
  .post(roleCheck(config.ROLES.ADMIN), scheduleTrip);

// Delete trip by ID (admin only)
router.delete('/:id', roleCheck(config.ROLES.ADMIN), deleteTripById);

// Update trip details (admin only)
router.put('/:id', roleCheck(config.ROLES.ADMIN), updateTrip);

// Driver routes
router.get('/driver', roleCheck(config.ROLES.DRIVER), getTripsByDriver);
router.put('/:id/status', roleCheck(config.ROLES.DRIVER, config.ROLES.ADMIN), updateTripStatus);
router.put('/:id/location', roleCheck(config.ROLES.DRIVER), updateTripLocation);
router.post('/:id/incident', roleCheck(config.ROLES.DRIVER), reportIncident);

// Shared route
router.get('/:id', getTripById);

export default router;
