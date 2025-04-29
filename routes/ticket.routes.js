import express from 'express';
import {
  getAllTickets,
  getMyTickets,
  getTicketById,
  purchaseTicket,
  validateTicket,
  cancelTicket
} from '../controllers/ticket.controller.js';

import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin: Get all tickets
router.get('/', protect, authorize('admin'), getAllTickets);

// Passenger: Get my tickets
router.get('/my-tickets', protect, authorize('passenger'), getMyTickets);

// Passenger: Purchase a ticket
router.post('/', protect, authorize('passenger'), purchaseTicket);

// Driver or Admin: Validate a ticket
router.post('/validate', protect, authorize(['driver', 'admin']), validateTicket);

// Get ticket by ID (passenger or admin)
router.get('/:id', protect, getTicketById);

// Cancel ticket (passenger or admin)
router.put('/:id/cancel', protect, cancelTicket);

export default router;
