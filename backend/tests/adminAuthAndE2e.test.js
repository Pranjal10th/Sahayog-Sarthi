import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Worker from '../src/models/Worker.js';
import Booking from '../src/models/Booking.js';
import { globalTokenService, globalOtpStore } from '../src/modules/auth/infrastructure/di/container.js';
import { clearBookingTimeoutTimer } from '../src/services/reminderService.js';

dotenv.config();

const app = express();
app.use(express.json());

// Import modular routers
import authRoutes from '../src/modules/auth/interfaces/http/routes/authRoutes.js';
import workerRoutes from '../src/modules/worker/interfaces/http/routes/workerRoutes.js';
import bookingRoutes from '../src/modules/booking/interfaces/http/routes/bookingRoutes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);

const generateToken = (payload) => globalTokenService.generate(payload);

describe('Phase 3.8B Admin Auth & Marketplace E2E Integration Tests', () => {
  let dbConnection;
  let adminMobile = process.env.ADMIN_MOBILE || '9999999999';
  let customerToken;
  let customerUser;
  let workerUser;
  let workerToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi-test';
    dbConnection = await mongoose.connect(mongoUri);

    // Clean up
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});

    // Create standard customer
    customerUser = await User.create({ name: 'E2E Customer', mobile: '9999991111' });
    customerToken = generateToken({ id: customerUser._id, role: 'customer' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Admin OTP Login Flow', () => {
    it('should allow login for ADMIN_MOBILE and issue JWT with admin role without creating User record', async () => {
      // Step A: Request OTP
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile: adminMobile });

      const record = await globalOtpStore.get(adminMobile);
      expect(record).toBeDefined();

      // Step B: Verify OTP
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile: adminMobile, otp: record.otp });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('admin');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Administrator');

      // Verify that no User database record was created for the admin
      const adminInUserDb = await User.findOne({ mobile: adminMobile });
      expect(adminInUserDb).toBeNull();
      const adminInWorkerDb = await Worker.findOne({ mobile: adminMobile });
      expect(adminInWorkerDb).toBeNull();
    });
  });

  describe('2. Admin Dashboard & Route Protection', () => {
    let adminToken;

    beforeAll(async () => {
      adminToken = generateToken({ id: 'admin-root', role: 'admin' });
    });

    it('should block customer from retrieving admin overview', async () => {
      const res = await request(app)
        .get('/api/v1/workers/admin/overview')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Unauthorized role.');
    });

    it('should allow admin to retrieve admin overview', async () => {
      const res = await request(app)
        .get('/api/v1/workers/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
    });
  });

  describe('3. Worker Approval & Marketplace Flow E2E', () => {
    let adminToken;
    let newWorker;
    let pendingWorker;
    let rejectedWorker;
    let blockedWorker;

    beforeAll(async () => {
      adminToken = generateToken({ id: 'admin-root', role: 'admin' });

      // Create a pending worker
      newWorker = await Worker.create({
        name: 'Sarthi Ramesh',
        mobile: '8888881111',
        serviceCategory: 'Carpenter',
        experience: 5,
        hourlyRate: 200,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'pending'
      });
      workerToken = generateToken({ id: newWorker._id, role: 'worker' });

      // Pending worker to stay pending
      pendingWorker = await Worker.create({
        name: 'Pending Sarthi',
        mobile: '8888882222',
        serviceCategory: 'Carpenter',
        experience: 3,
        hourlyRate: 150,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'pending'
      });

      // Rejected worker
      rejectedWorker = await Worker.create({
        name: 'Rejected Sarthi',
        mobile: '8888883333',
        serviceCategory: 'Carpenter',
        experience: 2,
        hourlyRate: 120,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'rejected'
      });

      // Blocked worker
      blockedWorker = await Worker.create({
        name: 'Blocked Sarthi',
        mobile: '8888884444',
        serviceCategory: 'Carpenter',
        experience: 7,
        hourlyRate: 250,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'approved',
        isBlocked: true
      });
    });

    afterAll(async () => {
      await Worker.deleteMany({});
    });

    it('Step 1: Verify new worker starts as pending and cannot go online', async () => {
      const res = await request(app)
        .put(`/api/v1/workers/${newWorker._id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ isAvailable: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Worker KYC approval required.');
    });

    it('Step 2: Admin approves worker successfully', async () => {
      const res = await request(app)
        .put(`/api/v1/workers/${newWorker._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.worker.kycStatus).toBe('approved');
      expect(res.body.worker.isAvailable).toBe(true);
    });

    it('Step 3: Approved worker can toggle availability successfully', async () => {
      // Toggle offline first
      const resOffline = await request(app)
        .put(`/api/v1/workers/${newWorker._id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ isAvailable: false });

      expect(resOffline.status).toBe(200);
      expect(resOffline.body.worker.isAvailable).toBe(false);

      // Toggle online
      const resOnline = await request(app)
        .put(`/api/v1/workers/${newWorker._id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ isAvailable: true });

      expect(resOnline.status).toBe(200);
      expect(resOnline.body.worker.isAvailable).toBe(true);
    });

    it('Step 4: Nearby search returns only approved, online, unblocked worker', async () => {
      // Toggle online for pending, rejected, and blocked workers to test filters
      await Worker.findByIdAndUpdate(pendingWorker._id, { isAvailable: true });
      await Worker.findByIdAndUpdate(rejectedWorker._id, { isAvailable: true });
      await Worker.findByIdAndUpdate(blockedWorker._id, { isAvailable: true });

      // Run nearby search request
      const res = await request(app)
        .get('/api/v1/workers/nearby?lng=80.9462&lat=26.8467&radius=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workers.length).toBe(1);
      
      const foundWorker = res.body.workers[0];
      expect(foundWorker._id.toString()).toBe(newWorker._id.toString());
      expect(foundWorker.name).toBe('Sarthi Ramesh');
    });

    it('Step 5: Customer creates a booking for the approved worker successfully', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          workerId: newWorker._id,
          serviceType: 'Carpenter',
          amount: 200,
          customerAddress: 'Tiwari Ganj, Lucknow',
          notes: 'Fixing wooden door'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe('pending');
      expect(res.body.booking.workerId.toString()).toBe(newWorker._id.toString());
      
      // Verify stored in DB
      const bookingInDb = await Booking.findById(res.body.booking._id);
      expect(bookingInDb).toBeDefined();
      expect(bookingInDb.status).toBe('pending');

      // Clear the timeout countdown to prevent Jest warning
      clearBookingTimeoutTimer(res.body.booking._id);
    });
  });
});
