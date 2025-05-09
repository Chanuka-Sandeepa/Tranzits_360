import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import { initializeWebSocketServer } from './webSocket/websocket-server.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import websocketApiRoutes from './webSocket/api.js';
import analyticsRoutes from './routes/analytics.routes.js';
import Route from './routes/route.routes.js';
import trips from './routes/trip.routes.js';
import Ticket from './routes/ticket.routes.js';
import Vehicle from './routes/vehicle.routes.js';
import driverRoutes from './routes/driver.routes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocketServer(server);

// Body parser middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/websocket', websocketApiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/routes', Route);
app.use('/api/trips', trips);
app.use('/api/tickets', Ticket);
app.use('/api/vehicles', Vehicle);
app.use('/api/driver', driverRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});


// Define PORT and start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
