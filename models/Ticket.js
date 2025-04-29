import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Change 'Passenger' to 'User'
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  ticketType: {
    type: String,
    enum: ['single', 'return', 'day-pass', 'week-pass', 'month-pass'],
    required: true
  },
  fareCategory: {
    type: String,
    enum: ['regular', 'student', 'senior'],
    default: 'regular'
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit', 'debit', 'paypal', 'cash'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'cancelled', 'refunded'],
    default: 'active'
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Ticket = mongoose.model('Ticket', TicketSchema);
export default Ticket;
