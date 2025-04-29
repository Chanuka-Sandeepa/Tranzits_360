import express from 'express';
import {
  getDashboardAnalytics,
  getRouteAnalytics,
  getDriverAnalytics
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/routes', getRouteAnalytics);
router.get('/drivers', getDriverAnalytics);

export default router;