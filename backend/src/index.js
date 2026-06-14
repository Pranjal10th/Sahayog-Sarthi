// backend/src/index.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import env from './config/env.js'; // Validates env vars on import – crashes early if missing
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/worker.js';
import bookingRoutes from './routes/booking.js';
import paymentRoutes from './routes/payment.js';
import reviewRoutes from './routes/review.js'; 
import { initSocket } from './services/socketService.js';
import './services/telegramService.js';
const app = express();
const server = http.createServer(app);

// SRS Section 13 Constraints: Max 100 requests per minute per IP vector gate
const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Limit each IP footprint
  message: {
    success: false,
    error: 'Too many requests from this IP footprint. Security protocol block active for 60 seconds.'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Middlewares allocation
app.use(cors());
app.use(express.json());

// Apply global rate limiting right before hitting core API routes
app.use('/api/v1/', globalRateLimiter);

// Database Verification Cluster hook [cite: 231]
connectDB();

// Core Real-Time Socket Cluster engine activation [cite: 190, 252]
initSocket(server);

// Complete REST API Global Endpoints Tree Map [cite: 149]
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes); 

// Static folder service to expose uploaded KYC documents [cite: 288]
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('🚀 Sahayog Sarthi Micro-Engine: All Core Backend APIs are 100% Operational!');
});

const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`🔥 Real-time Cluster active on port ${PORT}`);
});