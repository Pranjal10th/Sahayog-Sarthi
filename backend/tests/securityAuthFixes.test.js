import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Worker from '../src/models/Worker.js';
import Booking from '../src/models/Booking.js';
import { globalTokenService, globalOtpStore, sendOtpUseCase } from '../src/modules/auth/infrastructure/di/container.js';

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

describe('Phase 3.7A Security and Auth Fixes Integration Tests', () => {
  let dbConnection;
  let customerC;
  let customerD;
  let workerA;
  let workerB;
  let tokenCustomerC;
  let tokenCustomerD;
  let tokenWorkerA;
  let tokenWorkerB;
  let tokenAdmin;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi-test';
    dbConnection = await mongoose.connect(mongoUri);

    // Clean up
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});

    // Create test entities
    customerC = await User.create({ name: 'Customer C', mobile: '9999997771' });
    customerD = await User.create({ name: 'Customer D', mobile: '9999997772' });

    workerA = await Worker.create({
      name: 'Worker A',
      mobile: '8888887771',
      serviceCategory: 'Electrician',
      experience: 4,
      hourlyRate: 150,
      location: { type: 'Point', coordinates: [80.9462, 26.8467] },
      kycStatus: 'approved'
    });

    workerB = await Worker.create({
      name: 'Worker B',
      mobile: '8888887772',
      serviceCategory: 'Plumber',
      experience: 2,
      hourlyRate: 120,
      location: { type: 'Point', coordinates: [80.9462, 26.8467] },
      kycStatus: 'approved'
    });

    // Sign JWT tokens
    tokenCustomerC = generateToken({ id: customerC._id, role: 'customer' });
    tokenCustomerD = generateToken({ id: customerD._id, role: 'customer' });
    tokenWorkerA = generateToken({ id: workerA._id, role: 'worker' });
    tokenWorkerB = generateToken({ id: workerB._id, role: 'worker' });
    tokenAdmin = generateToken({ id: 'mock-admin', role: 'admin' });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. Worker Login Unification', () => {
    it('should authenticate a registered worker using OTP and return role=worker with correct profile', async () => {
      const mobile = '8888887771'; // Worker A's mobile number
      
      // Step 1: Send OTP
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile });

      const record = await globalOtpStore.get(mobile);
      expect(record).toBeDefined();

      // Step 2: Verify OTP
      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile, otp: record.otp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.token).toBeDefined();
      expect(verifyRes.body.role).toBe('worker');
      expect(verifyRes.body.user).toBeDefined();
      expect(verifyRes.body.user.name).toBe('Worker A');
      expect(verifyRes.body.user.serviceCategory).toBe('Electrician');

      // Verify that NO customer User profile has been generated in the users collection
      const userInDb = await User.findOne({ mobile });
      expect(userInDb).toBeNull();
    });

    it('should authenticate existing customer using OTP and return role=customer', async () => {
      const mobile = '9999997771'; // Customer C's mobile number

      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile });

      const record = await globalOtpStore.get(mobile);

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile, otp: record.otp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.role).toBe('customer');
      expect(verifyRes.body.user.name).toBe('Customer C');
    });
  });

  describe('2. Admin Route Protection', () => {
    it('should block customer from retrieving admin overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/workers/admin/overview')
        .set('Authorization', `Bearer ${tokenCustomerC}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Unauthorized role.');
    });

    it('should block worker from retrieving admin overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/workers/admin/overview')
        .set('Authorization', `Bearer ${tokenWorkerA}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Unauthorized role.');
    });

    it('should allow admin to retrieve admin overview metrics', async () => {
      const res = await request(app)
        .get('/api/v1/workers/admin/overview')
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block unauthorized users from hitting worker approval KYC API', async () => {
      const res = await request(app)
        .put(`/api/v1/workers/${workerA._id}/approve`)
        .set('Authorization', `Bearer ${tokenWorkerB}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Unauthorized role.');
    });

    it('should allow admin to hit worker approval KYC API', async () => {
      const res = await request(app)
        .put(`/api/v1/workers/${workerA._id}/approve`)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Booking Ownership Controls', () => {
    let testBooking;

    beforeEach(async () => {
      await Booking.deleteMany({});
      testBooking = await Booking.create({
        customerId: customerC._id,
        workerId: workerA._id,
        serviceType: 'Electrician',
        status: 'pending',
        amount: 250,
        customerAddress: 'Lucknow Street 4',
        paymentStatus: 'pending'
      });
    });

    it('should block Worker B from accepting Worker A\'s assigned booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/accept`)
        .set('Authorization', `Bearer ${tokenWorkerB}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You are not the assigned worker');
    });

    it('should allow Worker A to accept Worker A\'s assigned booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/accept`)
        .set('Authorization', `Bearer ${tokenWorkerA}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('accepted');
    });

    it('should block Worker B from starting Worker A\'s assigned booking', async () => {
      // Setup accepted state
      testBooking.status = 'accepted';
      await testBooking.save();

      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/start`)
        .set('Authorization', `Bearer ${tokenWorkerB}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You are not the assigned worker');
    });

    it('should allow Worker A to start Worker A\'s assigned booking', async () => {
      testBooking.status = 'accepted';
      await testBooking.save();

      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/start`)
        .set('Authorization', `Bearer ${tokenWorkerA}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('in_progress');
    });

    it('should block Worker B from completing Worker A\'s assigned booking', async () => {
      testBooking.status = 'in_progress';
      await testBooking.save();

      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/complete`)
        .set('Authorization', `Bearer ${tokenWorkerB}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You are not the assigned worker');
    });

    it('should allow Worker A to complete Worker A\'s assigned booking', async () => {
      testBooking.status = 'in_progress';
      await testBooking.save();

      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/complete`)
        .set('Authorization', `Bearer ${tokenWorkerA}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('completed');
    });

    it('should block Customer D from cancelling Customer C\'s assigned booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${tokenCustomerD}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You are not the assigned customer');
    });

    it('should allow Customer C to cancel Customer C\'s assigned booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${tokenCustomerC}`);

      expect(res.status).toBe(200);
      expect(res.body.booking.status).toBe('cancelled');
    });
  });

  describe('4. KYC Status Enforcements', () => {
    let pendingWorker;
    let rejectedWorker;
    let approvedWorker;
    let tokenPendingWorker;
    let tokenRejectedWorker;
    let tokenApprovedWorker;
    let testBookingPending;
    let testBookingRejected;
    let testBookingApproved;

    beforeEach(async () => {
      // Create workers with different KYC status
      pendingWorker = await Worker.create({
        name: 'Pending Worker',
        mobile: '8888880001',
        serviceCategory: 'Electrician',
        experience: 4,
        hourlyRate: 150,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'pending'
      });

      rejectedWorker = await Worker.create({
        name: 'Rejected Worker',
        mobile: '8888880002',
        serviceCategory: 'Electrician',
        experience: 4,
        hourlyRate: 150,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'rejected'
      });

      approvedWorker = await Worker.create({
        name: 'Approved Worker',
        mobile: '8888880003',
        serviceCategory: 'Electrician',
        experience: 4,
        hourlyRate: 150,
        location: { type: 'Point', coordinates: [80.9462, 26.8467] },
        kycStatus: 'approved'
      });

      tokenPendingWorker = generateToken({ id: pendingWorker._id, role: 'worker' });
      tokenRejectedWorker = generateToken({ id: rejectedWorker._id, role: 'worker' });
      tokenApprovedWorker = generateToken({ id: approvedWorker._id, role: 'worker' });

      // Create bookings assigned to each
      testBookingPending = await Booking.create({
        customerId: customerC._id,
        workerId: pendingWorker._id,
        serviceType: 'Electrician',
        status: 'pending',
        amount: 250,
        customerAddress: 'Lucknow Street 4',
        paymentStatus: 'pending'
      });

      testBookingRejected = await Booking.create({
        customerId: customerC._id,
        workerId: rejectedWorker._id,
        serviceType: 'Electrician',
        status: 'pending',
        amount: 250,
        customerAddress: 'Lucknow Street 4',
        paymentStatus: 'pending'
      });

      testBookingApproved = await Booking.create({
        customerId: customerC._id,
        workerId: approvedWorker._id,
        serviceType: 'Electrician',
        status: 'pending',
        amount: 250,
        customerAddress: 'Lucknow Street 4',
        paymentStatus: 'pending'
      });
    });

    afterEach(async () => {
      await Worker.deleteMany({ mobile: { $in: ['8888880001', '8888880002', '8888880003'] } });
      await Booking.deleteMany({ workerId: { $in: [pendingWorker?._id, rejectedWorker?._id, approvedWorker?._id] } });
    });

    it('pending worker cannot accept booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBookingPending._id}/accept`)
        .set('Authorization', `Bearer ${tokenPendingWorker}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Worker KYC approval required.');
    });

    it('rejected worker cannot accept booking', async () => {
      const res = await request(app)
        .put(`/api/v1/bookings/${testBookingRejected._id}/accept`)
        .set('Authorization', `Bearer ${tokenRejectedWorker}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Worker KYC approval required.');
    });

    it('pending worker cannot go online', async () => {
      const res = await request(app)
        .put(`/api/v1/workers/${pendingWorker._id}`)
        .set('Authorization', `Bearer ${tokenPendingWorker}`)
        .send({ isAvailable: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Worker KYC approval required.');
    });

    it('approved worker can still work', async () => {
      // 1. Can go online
      const onlineRes = await request(app)
        .put(`/api/v1/workers/${approvedWorker._id}`)
        .set('Authorization', `Bearer ${tokenApprovedWorker}`)
        .send({ isAvailable: true });

      expect(onlineRes.status).toBe(200);
      expect(onlineRes.body.worker.isAvailable).toBe(true);

      // 2. Can accept booking
      const acceptRes = await request(app)
        .put(`/api/v1/bookings/${testBookingApproved._id}/accept`)
        .set('Authorization', `Bearer ${tokenApprovedWorker}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.booking.status).toBe('accepted');

      // 3. Can start booking
      const startRes = await request(app)
        .put(`/api/v1/bookings/${testBookingApproved._id}/start`)
        .set('Authorization', `Bearer ${tokenApprovedWorker}`);

      expect(startRes.status).toBe(200);
      expect(startRes.body.booking.status).toBe('in_progress');

      // 4. Can complete booking
      const completeRes = await request(app)
        .put(`/api/v1/bookings/${testBookingApproved._id}/complete`)
        .set('Authorization', `Bearer ${tokenApprovedWorker}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.booking.status).toBe('completed');
    });
  });
});

