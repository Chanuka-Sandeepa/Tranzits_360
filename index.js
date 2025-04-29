import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

// Body parser middleware
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error'
  });
});

// Define PORT
const PORT = process.env.PORT || 5000;

// 👉 Create HTTP server using app
const server = http.createServer(app);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
