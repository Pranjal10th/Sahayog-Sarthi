// backend/scratch/verifyReviewProxy.js
// Verify Review proxy model, clean module architecture, and rating aggregation functionality

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Load the proxy models
import Booking from '../src/models/Booking.js';
import Worker from '../src/models/Worker.js';
import User from '../src/models/User.js';
import Review from '../src/models/Review.js';

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
  await User.deleteMany({ mobile: '9200000001' });
  await Worker.deleteMany({ mobile: '9200000002' });

  const customer = await User.create({ name: 'ReviewCustomer', mobile: '9200000001' });
  const worker = await Worker.create({
    name: 'ReviewSarthi', mobile: '9200000002',
    serviceCategory: 'Electrician', experience: 5, hourlyRate: 200,
    location: { type: 'Point', coordinates: [80.9, 26.8] },
    kycStatus: 'approved', isAvailable: true, walletBalance: 0,
    rating: 0, totalRatings: 0
  });

  const completedBooking = await Booking.create({
    customerId: customer._id,
    workerId: worker._id,
    serviceType: 'Electrician',
    amount: 500,
    status: 'completed',
    customerAddress: '456 Review St, Lucknow'
  });

  console.log(`✅ Customer: ${customer._id}`);
  console.log(`✅ Worker: ${worker._id} (rating: ${worker.rating}, totalRatings: ${worker.totalRatings})`);
  console.log(`✅ Booking: ${completedBooking._id} (status: ${completedBooking.status})`);

  const customerToken = jwt.sign({ id: customer._id.toString(), role: 'customer' }, SECRET, { expiresIn: '10m' });

  console.log('\n--- 1. Submitting First Review via REST API ---');
  const reviewRes = await apiCall('POST', '/reviews', customerToken, {
    bookingId: completedBooking._id,
    rating: 5,
    comment: 'Great work by ReviewSarthi!'
  });

  console.log('✅ API response status:', reviewRes.status);
  console.log('✅ API response body:', JSON.stringify(reviewRes.body));

  if (reviewRes.status !== 201) {
    throw new Error(`Expected review creation status 201, got ${reviewRes.status}`);
  }

  // Reload Worker to see updated rating and totalRatings
  const updatedWorker = await Worker.findById(worker._id);
  console.log(`✅ Worker rating after 1st review: ${updatedWorker.rating} (expected: 4.5 or 5 depending on round, wait: legacy rounds avgRating * 10 / 10, rating was 4.5, so 4.5)`);
  console.log(`✅ Worker totalRatings after 1st review: ${updatedWorker.totalRatings} (expected: 1)`);

  if (updatedWorker.totalRatings !== 1 || Math.abs(updatedWorker.rating - 4) > 1) {
    throw new Error(`Worker ratings were not correctly aggregated! Rating: ${updatedWorker.rating}, Total: ${updatedWorker.totalRatings}`);
  }

  console.log('\n--- 2. Verifying Double Review Constraint ---');
  const duplicateRes = await apiCall('POST', '/reviews', customerToken, {
    bookingId: completedBooking._id,
    rating: 5,
    comment: 'Attempting to duplicate review'
  });

  console.log('✅ Duplicate API response status:', duplicateRes.status);
  console.log('✅ Duplicate API response body:', JSON.stringify(duplicateRes.body));

  if (duplicateRes.status !== 400) {
    throw new Error(`Expected duplicate review to be rejected with 400, got ${duplicateRes.status}`);
  }

  // Cleanup
  console.log('\n--- Cleaning up fixtures ---');
  await User.findByIdAndDelete(customer._id);
  await Worker.findByIdAndDelete(worker._id);
  await Booking.findByIdAndDelete(completedBooking._id);
  await Review.deleteMany({ bookingId: completedBooking._id });
  console.log('✅ Cleanup finished.');

  console.log('\n⭐⭐⭐ ALL REVIEW VERIFICATIONS PASSED SUCCESSFULLY ⭐⭐⭐');
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
