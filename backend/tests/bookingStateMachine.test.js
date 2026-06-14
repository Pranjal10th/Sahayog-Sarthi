import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import Booking from '../src/models/Booking.js';
import Worker from '../src/models/Worker.js';
import Payment from '../src/models/Payment.js';
import User from '../src/models/User.js';
import { generateToken } from '../src/services/authService.js';

// Setup basic Express app matching index.js for test router target
import authRoutes from '../src/routes/auth.js';
import workerRoutes from '../src/routes/worker.js';
import bookingRoutes from '../src/routes/booking.js';
import paymentRoutes from '../src/routes/payment.js';

const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);

describe('Sahayog Sarthi Booking State Machine Integration Tests', () => {
  let dbConnection;
  let testCustomer;
  let testWorker;
  let customerToken;
  let workerToken;

  beforeAll(async () => {
    // Connect to test db
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi-test';
    dbConnection = await mongoose.connect(mongoUri);

    // Clean up collections to ensure state equilibrium
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});

    // Create test customer
    testCustomer = await User.create({
      name: 'State Customer',
      mobile: '9999990001'
    });

    // Create test worker
    testWorker = await Worker.create({
      name: 'State Sarthi',
      mobile: '8888880001',
      serviceCategory: 'Electrician',
      experience: 5,
      hourlyRate: 150,
      location: {
        type: 'Point',
        coordinates: [80.9462, 26.8467]
      },
      kycStatus: 'approved',
      walletBalance: 100
    });

    // Generate real JWT tokens
    customerToken = generateToken({ id: testCustomer._id, role: 'customer' });
    workerToken = generateToken({ id: testWorker._id, role: 'worker' });
  });

  afterAll(async () => {
    // Cleanup and close
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.connection.close();
  });

  // Helper to create a booking in a specific initial status
  const createBookingInStatus = async (status, paymentStatus = 'pending') => {
    return await Booking.create({
      customerId: testCustomer._id,
      workerId: testWorker._id,
      serviceType: 'Electrician',
      status: status,
      amount: 300,
      customerAddress: 'Lucknow Staging Console',
      paymentStatus: paymentStatus
    });
  };

  describe('1. Valid Lifecycle Transitions', () => {
    test('Should execute full lifecycle: pending -> accepted -> in_progress -> completed -> paid', async () => {
      // A. Create pending booking
      const booking = await createBookingInStatus('pending');

      // B. pending -> accepted
      const acceptRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/accept`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.booking.status).toBe('accepted');

      // C. accepted -> in_progress (Manual start – no GPS geofencing checked)
      const startRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/start`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(startRes.status).toBe(200);
      expect(startRes.body.booking.status).toBe('in_progress');

      // D. in_progress -> completed
      const completeRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.booking.status).toBe('completed');

      // E. completed -> paid (via payment verify endpoint)
      // First generate order
      const orderRes = await request(app)
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ bookingId: booking._id });

      expect(orderRes.status).toBe(200);
      const mockOrderId = orderRes.body.order.id;

      // Now verify payment to transition to paid status
      const verifyRes = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: 'pay_mock_verified_signature_token',
          razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature'
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.booking.status).toBe('paid');
      expect(verifyRes.body.booking.paymentStatus).toBe('paid');
    });
  });

  describe('2. Alternative Cancellation Paths', () => {
    test('Should allow pending -> cancelled transition without penalty fee', async () => {
      const booking = await createBookingInStatus('pending');

      const cancelRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.booking.status).toBe('cancelled');
      expect(cancelRes.body.booking.metadata?.cancellationFee).toBeUndefined();
    });

    test('Should allow accepted -> cancelled transition and track Rs.50 metadata fee without deducting balance', async () => {
      // Reset worker wallet balance to ensure test isolation
      await Worker.findByIdAndUpdate(testWorker._id, { walletBalance: 100 });

      const booking = await createBookingInStatus('accepted');

      const cancelRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.booking.status).toBe('cancelled');
      
      const feeInfo = cancelRes.body.booking.metadata?.cancellationFee;
      expect(feeInfo).toBeDefined();
      expect(feeInfo.amount).toBe(50);
      expect(feeInfo.currency).toBe('INR');

      // Ensure no balance change on worker
      const worker = await Worker.findById(testWorker._id);
      expect(worker.walletBalance).toBe(100);
    });
  });

  describe('3. Blocked Worker Validation Constraints', () => {
    test('Blocked worker cannot accept a booking', async () => {
      // Mark worker as blocked
      await Worker.findByIdAndUpdate(testWorker._id, { isBlocked: true });

      const booking = await createBookingInStatus('pending');

      const acceptRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/accept`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(acceptRes.status).toBe(403);
      expect(acceptRes.body.error).toContain('blocked');

      // Revert blocked status
      await Worker.findByIdAndUpdate(testWorker._id, { isBlocked: false });
    });

    test('Blocked worker cannot modify profile to go online/available', async () => {
      await Worker.findByIdAndUpdate(testWorker._id, { isBlocked: true, isAvailable: false });

      const profileRes = await request(app)
        .put(`/api/v1/workers/${testWorker._id}`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({ isAvailable: true });

      expect(profileRes.status).toBe(403);
      expect(profileRes.body.error).toContain('Blocked workers');

      // Revert
      await Worker.findByIdAndUpdate(testWorker._id, { isBlocked: false });
    });
  });

  describe('4. Invalid Transitions (guards)', () => {
    test('Should fail if starting booking from pending (not accepted)', async () => {
      const booking = await createBookingInStatus('pending');
      const startRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/start`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(startRes.status).toBe(400);
    });

    test('Should fail if completing booking from accepted (not in_progress)', async () => {
      const booking = await createBookingInStatus('accepted');
      const completeRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/complete`)
        .set('Authorization', `Bearer ${workerToken}`);

      expect(completeRes.status).toBe(400);
    });

    test('Should fail if verifying payment signature on non-completed booking', async () => {
      const booking = await createBookingInStatus('in_progress');
      
      const verifyRes = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking._id,
          razorpay_order_id: 'order_mock_test_123',
          razorpay_payment_id: 'pay_mock_test_123',
          razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature'
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error).toContain('completed');
    });

    test('Should fail if cancelling a completed booking', async () => {
      const booking = await createBookingInStatus('completed');
      const cancelRes = await request(app)
        .put(`/api/v1/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(cancelRes.status).toBe(400);
    });
  });
});
