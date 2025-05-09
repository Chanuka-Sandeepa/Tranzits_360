import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Route from '../models/Route.js';

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private/Admin
export const getAllTickets = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;

  let query = {};

  if (startDate && endDate) {
    query.purchasedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  if (status) {
    query.status = status;
  }

  const tickets = await Ticket.find(query)
    .populate('passenger', 'firstName lastName email')
    .populate('route', 'routeNumber name')
    .sort({ purchasedAt: -1 });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get passenger tickets
// @route   GET /api/tickets/my-tickets
// @access  Private/Passenger
export const getMyTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = { passenger: req.user.id };

  if (status) {
    query.status = status;
  }

  const tickets = await Ticket.find(query)
    .populate('route', 'routeNumber name type')
    .sort({ purchasedAt: -1 });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('passenger', 'firstName lastName email')
    .populate('route', 'routeNumber name type stops');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  if (req.role !== 'admin' && ticket.passenger.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this ticket'
    });
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Purchase ticket
// @route   POST /api/tickets
// @access  Private/Passenger
export const purchaseTicket = asyncHandler(async (req, res) => {
  const { routeId, ticketType, fareCategory, paymentMethod } = req.body;

  // Validate required fields
  if (!routeId || !ticketType || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Check if route exists
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }

  // Get the authenticated user
  const user = await User.findById(req.user.id); // Assuming req.user is populated with the logged-in user

  // Check if the user exists and has the 'passenger' role
  if (!user || user.role !== 'passenger') {
    return res.status(403).json({
      success: false,
      message: 'User is not a passenger or not authorized to purchase a ticket'
    });
  }

  // Calculate validity period based on ticket type
  let validFrom = new Date();
  let validUntil = new Date();

  switch(ticketType) {
    case 'single':
      validUntil.setHours(validUntil.getHours() + 2);
      break;
    case 'return':
      validUntil.setDate(validUntil.getDate() + 1);
      break;
    case 'day-pass':
      validUntil.setHours(23, 59, 59, 999);
      break;
    case 'week-pass':
      validUntil.setDate(validUntil.getDate() + 7);
      break;
    case 'month-pass':
      validUntil.setDate(validUntil.getDate() + 30);
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket type'
      });
  }

  // Calculate price based on fare category and ticket type
  let basePrice = route.fare.regular;

  if (fareCategory === 'student' && route.fare.student) {
    basePrice = route.fare.student;
  } else if (fareCategory === 'senior' && route.fare.senior) {
    basePrice = route.fare.senior;
  }

  let priceMultiplier = 1;

  switch(ticketType) {
    case 'return':
      priceMultiplier = 1.8; // 10% discount for return
      break;
    case 'day-pass':
      priceMultiplier = 2.5;
      break;
    case 'week-pass':
      priceMultiplier = 10;
      break;
    case 'month-pass':
      priceMultiplier = 30;
      break;
  }

  const price = basePrice * priceMultiplier;

  // Generate unique QR code
  const qrCode = crypto.randomBytes(16).toString('hex');

  // Create the ticket
  const ticket = await Ticket.create({
    passenger: user._id, // Link ticket to the user (passenger)
    route: routeId,
    ticketType,
    fareCategory: fareCategory || 'regular',
    validFrom,
    validUntil,
    price,
    paymentMethod,
    qrCode
  });

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Validate ticket
// @route   POST /api/tickets/validate
// @access  Private/Driver or Admin
export const validateTicket = asyncHandler(async (req, res) => {
  // Check if user is either a driver or admin
  if (req.role !== 'driver' && req.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to validate tickets'
    });
  }

  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({
      success: false,
      message: 'Please provide QR code'
    });
  }

  const ticket = await Ticket.findOne({ qrCode })
    .populate('passenger', 'firstName lastName')
    .populate('route', 'routeNumber name');

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  const now = new Date();

  if (ticket.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: `Ticket is ${ticket.status}`,
      data: { ticket }
    });
  }

  if (now < ticket.validFrom || now > ticket.validUntil) {
    ticket.status = 'expired';
    await ticket.save();

    return res.status(400).json({
      success: false,
      message: 'Ticket has expired',
      data: { ticket }
    });
  }

  if (['single', 'return'].includes(ticket.ticketType)) {
    ticket.status = 'used';
    ticket.usedAt = now;
  }

  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Ticket is valid',
    data: { ticket }
  });
});

// @desc    Cancel ticket
// @route   PUT /api/tickets/:id/cancel
// @access  Private/Passenger or Admin
export const cancelTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  if (req.role !== 'admin' && ticket.passenger.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this ticket'
    });
  }

  if (ticket.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel ticket with status: ${ticket.status}`
    });
  }

  ticket.status = 'cancelled';
  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Ticket cancelled successfully',
    data: {
      id: ticket._id,
      status: ticket.status
    }
  });
});
