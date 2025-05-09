import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Changed from 'Driver' to 'User'
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
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
  currentSpeed: {
    type: Number,
    default: 0
  },
  delay: {
    type: Number,  // delay in minutes
    default: 0
  },
  passengerCount: {
    type: Number,
    default: 0
  },
  stopUpdates: [{
    stopId: {
      type: mongoose.Schema.Types.ObjectId
    },
    stopName: String,
    actualArrivalTime: Date,
    scheduledArrivalTime: Date,
    passengerBoarding: Number,
    passengerAlighting: Number
  }],
  incidents: [{
    type: {
      type: String,
      enum: ['delay', 'accident', 'breakdown', 'other']
    },
    description: String,
    time: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Create 2dsphere index for real-time location queries
TripSchema.index({ currentLocation: '2dsphere' });

const Trip = mongoose.model('Trip', TripSchema);
export default Trip;