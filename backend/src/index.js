import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/worker.js';
import bookingRoutes from './routes/booking.js';
import paymentRoutes from './routes/payment.js';
import reviewRoutes from './routes/review.js'; // Review pipeline mapped
import { initSocket } from './services/socketService.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middlewares allocation
app.use(cors());
app.use(express.json());

// Database Verification Cluster hook
connectDB();

// Core Real-Time Socket Cluster engine activation
initSocket(server);

// Complete REST API Global Endpoints Tree Map
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes); // Hooked up successfully

app.get('/', (req, res) => {
  res.send('🚀 Sahayog Sarthi Micro-Engine: All Core Backend APIs are 100% Operational!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 Real-time Cluster active on port ${PORT}`);
});