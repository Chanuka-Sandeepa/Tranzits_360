import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/, 
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'passenger'],
    default: 'passenger',
  },
  firstName: {
    type: String,
    required: [true, 'Please add a first name'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Please add a last name'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
  },
  idNumber: {
    type: String,
    required: [true, 'Please add an ID number'],
    unique: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // Passenger-specific fields
  homeAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  workAddress: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  paymentMethods: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit', 'paypal'],
      },
      lastFour: { type: String, match: [/^\d{4}$/, 'Last four digits required'] },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  preferredDrivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Refers to drivers
  }],

  // Driver-specific fields
  licenseNumber: { type: String, trim: true },
  licenseExpiry: { type: Date },
  vehicle: {
    type: mongoose.Schema.Types.Mixed, // Vehicle details as an object
    default: null,
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  rating: {
    type: Number,
    min: [1, 'Rating cannot be lower than 1'],
    max: [5, 'Rating cannot be higher than 5'],
    default: 5,
  },
  totalRides: {
    type: Number,
    default: 0,
  },

  // Admin-specific fields
  adminData: {
    permissions: [{
      type: String,
      enum: ['manage_users', 'manage_drivers', 'manage_passengers', 'manage_rides', 'view_analytics', 'manage_payments'],
    }],
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
});

// Indexing for performance & uniqueness
UserSchema.index({ email: 1, idNumber: 1 }, { unique: true });
UserSchema.index({ currentLocation: '2dsphere' });

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user-entered password with stored hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

const User = mongoose.model('User', UserSchema);
export default User;
