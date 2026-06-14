import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import Booking from '../src/models/Booking.js';
import Worker from '../src/models/Worker.js';
import Payment from '../src/models/Payment.js';
import User from '../src/models/User.js';
import { globalTokenService } from '../src/modules/auth/infrastructure/di/container.js';
const generateToken = (payload) => globalTokenService.generate(payload);

// Setup basic Express app matching index.js for test router target
import authRoutes from '../src/modules/auth/interfaces/http/routes/authRoutes.js';
import workerRoutes from '../src/modules/worker/interfaces/http/routes/workerRoutes.js';
import bookingRoutes from '../src/modules/booking/interfaces/http/routes/bookingRoutes.js';
import paymentRoutes from '../src/modules/payment/interfaces/http/routes/paymentRoutes.js';

const app = express();
app.use(express.json());

// Inject the standard middleware protect configuration
import protect from '../src/middlewares/authMiddleware.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);

describe('Sahayog Sarthi Phase 1 Integration Tests', () => {
  let dbConnection;
  let testCustomer;
  let testWorker;
  let testBooking;
  let customerToken;
  let workerToken;
  let adminToken;

  beforeAll(async () => {
    // Connect to test db (using MONGO_URI from env or local fallback)
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi-test';
    dbConnection = await mongoose.connect(mongoUri);

    // Clean up collections to ensure state equilibrium
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});

    // Create test customer
    testCustomer = await User.create({
      name: 'Test Customer',
      mobile: '9999999999'
    });

    // Create test worker
    testWorker = await Worker.create({
      name: 'Test Sarthi',
      mobile: '8888888888',
      serviceCategory: 'Electrician',
      experience: 5,
      hourlyRate: 150,
      location: {
        type: 'Point',
        coordinates: [80.9462, 26.8467]
      },
      kycStatus: 'pending',
      walletBalance: 100
    });

    // Create test booking
    testBooking = await Booking.create({
      customerId: testCustomer._id,
      workerId: testWorker._id,
      serviceType: 'Electrician',
      status: 'completed',
      amount: 300,
      customerAddress: 'Lucknow Sandbox',
      paymentStatus: 'pending'
    });

    // Generate real JWT tokens
    customerToken = generateToken({ id: testCustomer._id, role: 'customer' });
    workerToken = generateToken({ id: testWorker._id, role: 'worker' });
    adminToken = generateToken({ id: 'test-admin-id', role: 'admin' });
  });

  afterAll(async () => {
    // Cleanup and close
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await mongoose.connection.close();
  });

  // 1. Database Model Fix
  test('POST /api/v1/payments/create-order should generate Order and Payment schema document log', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId: testBooking._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();

    // Verify Payment document is created in DB
    const payment = await Payment.findOne({ bookingId: testBooking._id });
    expect(payment).toBeDefined();
    expect(payment.status).toBe('created');
    expect(payment.amount).toBe(300);
    expect(payment.platformFee).toBe(45); // 15% of 300
    expect(payment.workerAmount).toBe(255);
  });

  // 2. Redirect Query Mismatch & Review Modal Trigger Fix (Simulation verify)
  test('POST /api/v1/payments/verify should process Sandbox verification & top-up Sarthi wallet balance', async () => {
    const paymentRecord = await Payment.findOne({ bookingId: testBooking._id });
    const orderId = paymentRecord.razorpayOrderId;

    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: testBooking._id,
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_mock_verified_signature_token',
        razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify Booking paymentStatus updated to paid
    const updatedBooking = await Booking.findById(testBooking._id);
    expect(updatedBooking.paymentStatus).toBe('paid');

    // Verify Worker Wallet Balance credited: net 255 added to initial 100
    const updatedWorker = await Worker.findById(testWorker._id);
    expect(updatedWorker.walletBalance).toBe(355);

    // Verify Payment document is updated to paid
    const updatedPayment = await Payment.findOne({ bookingId: testBooking._id });
    expect(updatedPayment.status).toBe('paid');
    expect(updatedPayment.paymentMethod).toBe('mock_wallet');
  });

  // 3. KYC approve/reject/block/unblock and Admin overview API
  test('PUT /api/v1/workers/:id/approve and reject/block should work correctly', async () => {
    // 1. Admin overview metrics check
    const metricsRes = await request(app)
      .get('/api/v1/workers/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.success).toBe(true);
    expect(metricsRes.body.metrics.totalUsers).toBeDefined();

    // 2. Approve worker
    const approveRes = await request(app)
      .put(`/api/v1/workers/${testWorker._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.worker.kycStatus).toBe('approved');
    expect(approveRes.body.worker.isAvailable).toBe(true);

    // 3. Block worker
    const blockRes = await request(app)
      .put(`/api/v1/workers/${testWorker._id}/block`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(blockRes.status).toBe(200);
    expect(blockRes.body.success).toBe(true);
    expect(blockRes.body.worker.isBlocked).toBe(true);
    expect(blockRes.body.worker.isAvailable).toBe(false);

    // 4. Unblock worker
    const unblockRes = await request(app)
      .put(`/api/v1/workers/${testWorker._id}/unblock`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(unblockRes.status).toBe(200);
    expect(unblockRes.body.success).toBe(true);
    expect(unblockRes.body.worker.isBlocked).toBe(false);
  });

  // 4. Wallet withdrawal route POST /payments/withdraw
  test('POST /api/v1/payments/withdraw should process worker withdrawals', async () => {
    // Reset worker wallet balance to 500 for withdrawal check
    await Worker.findByIdAndUpdate(testWorker._id, { walletBalance: 500 });

    const withdrawRes = await request(app)
      .post('/api/v1/payments/withdraw')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ amount: 200 });

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.success).toBe(true);
    expect(withdrawRes.body.newBalance).toBe(300);

    const withdrawalPayment = await Payment.findOne({
      workerId: testWorker._id,
      transactionType: 'withdrawal'
    });
    expect(withdrawalPayment).toBeDefined();
    expect(withdrawalPayment.amount).toBe(200);
    expect(withdrawalPayment.status).toBe('withdrawal_completed');
  });
});
