import express from 'express';
import {
  getAllRoutes,
  getRouteById,
  addRoute,
  updateRoute,
  deleteRoute,
  findRoutesNearLocation
} from '../controllers/route.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Admin-only routes
router.route('/')
  .get(getAllRoutes)
  .post(authorize('admin'), addRoute);

router.route('/:id')
  .get(authorize(['admin', 'driver']), getRouteById)
  .put(authorize('admin'), updateRoute)
  .delete(authorize('admin'), deleteRoute);

// Public route
router.get('/near', findRoutesNearLocation);

export default router;
