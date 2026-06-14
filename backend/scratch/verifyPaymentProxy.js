// backend/scratch/verifyPaymentProxy.js
// Verify Payment proxy model, clean module architecture, payment verification, and wallet settlement

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Load the proxy models
import Booking from '../src/models/Booking.js';
import Worker from '../src/models/Worker.js';
import User from '../src/models/User.js';
import Payment from '../src/models/Payment.js';

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017';
const SECRET = process.env.JWT_SECRET;

function apiCall(method, path, token, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', e => resolve({ status: 'ERR', body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO);
  console.log('✅ Connected to MongoDB');

  // Create clean fixtures
  console.log('\n--- Creating fixtures ---');
  await User.deleteMany({ mobile: '9300000001' });
  await Worker.deleteMany({ mobile: '9300000002' });

  const customer = await User.create({ name: 'PaymentCustomer', mobile: '9300000001' });
  const worker = await Worker.create({
    name: 'PaymentSarthi', mobile: '9300000002',
    serviceCategory: 'Electrician', experience: 5, hourlyRate: 200,
    location: { type: 'Point', coordinates: [80.9, 26.8] },
    kycStatus: 'approved', isAvailable: true, walletBalance: 100
  });

  const completedBooking = await Booking.create({
    customerId: customer._id,
    workerId: worker._id,
    serviceType: 'Electrician',
    amount: 400,
    status: 'completed',
    customerAddress: '789 Payment Rd, Lucknow'
  });

  console.log(`✅ Customer: ${customer._id}`);
  console.log(`✅ Worker: ${worker._id} (Initial wallet: ₹${worker.walletBalance})`);
  console.log(`✅ Booking: ${completedBooking._id} (status: ${completedBooking.status}, amount: ₹${completedBooking.amount})`);

  const customerToken = jwt.sign({ id: customer._id.toString(), role: 'customer' }, SECRET, { expiresIn: '10m' });
  const workerToken = jwt.sign({ id: worker._id.toString(), role: 'worker' }, SECRET, { expiresIn: '10m' });

  console.log('\n--- 1. Creating Payment Order via REST API ---');
  const orderRes = await apiCall('POST', '/payments/create-order', customerToken, {
    bookingId: completedBooking._id
  });

  console.log('✅ Order API status:', orderRes.status);
  console.log('✅ Order API response:', JSON.stringify(orderRes.body));

  if (orderRes.status !== 200) {
    throw new Error(`Expected order creation status 200, got ${orderRes.status}`);
  }

  const mockOrderId = orderRes.body.order.id;
  const paymentDoc = await Payment.findOne({ razorpayOrderId: mockOrderId });
  console.log('✅ Verified Payment document exists in DB with status:', paymentDoc?.status);

  if (!paymentDoc || paymentDoc.status !== 'created') {
    throw new Error('Payment document not created or status is not "created"');
  }

  console.log('\n--- 2. Verifying Payment Signature ---');
  const verifyRes = await apiCall('POST', '/payments/verify', customerToken, {
    bookingId: completedBooking._id,
    razorpay_order_id: mockOrderId,
    razorpay_payment_id: 'pay_mock_verify_test_123',
    razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature'
  });

  console.log('✅ Verify API status:', verifyRes.status);
  console.log('✅ Verify API response:', JSON.stringify(verifyRes.body));

  if (verifyRes.status !== 200) {
    throw new Error(`Expected verification status 200, got ${verifyRes.status}`);
  }

  // Reload models
  const bookingAfter = await Booking.findById(completedBooking._id);
  const workerAfter = await Worker.findById(worker._id);
  const paymentAfter = await Payment.findOne({ razorpayOrderId: mockOrderId });

  console.log(`✅ Booking status after verify: ${bookingAfter.status} (expected: "paid")`);
  console.log(`✅ Booking paymentStatus after verify: ${bookingAfter.paymentStatus} (expected: "paid")`);
  console.log(`✅ Payment document status after verify: ${paymentAfter.status} (expected: "paid")`);
  console.log(`✅ Worker wallet balance after verify: ₹${workerAfter.walletBalance}`);

  const commissionRate = Number(process.env.PLATFORM_COMMISSION) || 0.15;
  const expectedNet = completedBooking.amount * (1 - commissionRate); // 400 * 0.85 = ₹340
  const expectedBalance = 100 + expectedNet; // 100 + 340 = 440

  console.log(`✅ Expected wallet balance: ₹${expectedBalance}`);

  if (bookingAfter.status !== 'paid' || bookingAfter.paymentStatus !== 'paid' || paymentAfter.status !== 'paid') {
    throw new Error('Booking or Payment status did not transition to "paid"');
  }

  if (Math.abs(workerAfter.walletBalance - expectedBalance) > 0.01) {
    throw new Error(`Worker wallet balance incorrect. Got ${workerAfter.walletBalance}, expected ${expectedBalance}`);
  }

  console.log('\n--- 3. Testing Wallet Withdrawal ---');
  const withdrawRes = await apiCall('POST', '/payments/withdraw', workerToken, {
    amount: 150
  });

  console.log('✅ Withdrawal API status:', withdrawRes.status);
  console.log('✅ Withdrawal API response:', JSON.stringify(withdrawRes.body));

  if (withdrawRes.status !== 200) {
    throw new Error(`Expected withdrawal status 200, got ${withdrawRes.status}`);
  }

  const workerFinal = await Worker.findById(worker._id);
  console.log(`✅ Worker wallet balance after withdrawal: ₹${workerFinal.walletBalance} (expected: ₹290)`);

  if (Math.abs(workerFinal.walletBalance - (expectedBalance - 150)) > 0.01) {
    throw new Error(`Worker wallet balance after withdrawal incorrect. Got ${workerFinal.walletBalance}`);
  }

  const withdrawalTx = await Payment.findOne({
    workerId: worker._id,
    transactionType: 'withdrawal',
    status: 'withdrawal_completed'
  });
  console.log('✅ Withdrawal transaction record found in DB with amount:', withdrawalTx?.amount);

  if (!withdrawalTx || withdrawalTx.amount !== 150) {
    throw new Error('Withdrawal transaction record not found or incorrect amount');
  }

  // Cleanup
  console.log('\n--- Cleaning up fixtures ---');
  await User.findByIdAndDelete(customer._id);
  await Worker.findByIdAndDelete(worker._id);
  await Booking.findByIdAndDelete(completedBooking._id);
  await Payment.deleteMany({ workerId: worker._id });
  console.log('✅ Cleanup finished.');

  console.log('\n⭐⭐⭐ ALL PAYMENT VERIFICATIONS PASSED SUCCESSFULLY ⭐⭐⭐');
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ VERIFICATION FAILED:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
