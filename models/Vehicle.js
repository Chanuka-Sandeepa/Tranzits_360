import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Please provide vehicle number'],
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    required: [true, 'Please specify vehicle type'],
    enum: ['bus', 'train'],
    default: 'bus'
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide vehicle capacity']
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'out-of-service'],
    default: 'active'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  routes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }],
  currentRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  lastMaintenance: {
    type: Date,
    default: Date.now
  },
  nextMaintenanceDue: {
    type: Date,
    required: true
  },
  features: {
    hasWifi: {
      type: Boolean,
      default: false
    },
    isAccessible: {
      type: Boolean,
      default: true
    },
    hasBikeRack: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geo-queries
VehicleSchema.index({ currentLocation: '2dsphere' });

const Vehicle = mongoose.model('Vehicle', VehicleSchema);
export default Vehicle;