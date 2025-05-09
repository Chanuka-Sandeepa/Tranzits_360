import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: [true, 'Please provide route number'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Please provide route name'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bus', 'train'],
    required: [true, 'Please specify route type']
  },
  stops: [{
    name: {
      type: String,
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    estimatedArrivalTime: {
      type: Number,  // minutes from route start
      required: true
    }
  }],
  distance: {
    type: Number,  // in kilometers
    required: true
  },
  estimatedDuration: {
    type: Number,  // in minutes
    required: true
  },
  fare: {
    regular: {
      type: Number,
      required: true
    },
    student: {
      type: Number,
      required: true
    },
    senior: {
      type: Number,
      required: true
    }
  },
  schedule: [{
    dayOfWeek: {
      type: Number,  // 0-6 (Sunday-Saturday)
      required: true
    },
    departureTimesFromOrigin: [{
      type: String,  // HH:MM format
      required: true
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create 2dsphere index for each stop's location
RouteSchema.index({ 'stops.location': '2dsphere' });

const Route = mongoose.model('Route', RouteSchema);
export default Route;