// backend/scratch/populateVerifyBooking.js
// Phase 3.3 populate verification — tests all 4 cross-model populate chains
// Run: node scratch/populateVerifyBooking.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import via PROXY paths — same paths as all app code uses
import Booking from '../src/models/Booking.js';
import Worker  from '../src/models/Worker.js';
import User    from '../src/models/User.js';
import Payment from '../src/models/Payment.js';
import Review  from '../src/models/Review.js';
import Chat    from '../src/models/Chat.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let ids = {};

async function setup() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅ MongoDB Connected');

  // ── Model registry check ──────────────────────────────────────
  console.log('\n📋 Model Registry Check:');
  console.log(`   mongoose.model('Booking') defined: ${!!mongoose.model('Booking')}`);
  console.log(`   collection name:`, mongoose.model('Booking').collection.collectionName);
  console.log(`   'Booking' count in registry:`, Object.keys(mongoose.models).filter(k => k === 'Booking').length);

  // ── Create test data ──────────────────────────────────────────
  const user = await User.create({ name: 'PopulateTest User', mobile: '7000000001' });
  const worker = await Worker.create({
    name: 'PopulateTest Sarthi', mobile: '7000000002',
    serviceCategory: 'Plumber', experience: 3, hourlyRate: 200,
    location: { type: 'Point', coordinates: [80.9462, 26.8467] },
    kycStatus: 'approved', isAvailable: true,
  });
  const booking = await Booking.create({
    customerId: user._id, workerId: worker._id,
    serviceType: 'Plumbing', amount: 400,
    customerAddress: '5 Test Street, Lucknow', status: 'completed',
  });
  const payment = await Payment.create({
    bookingId: booking._id, workerId: worker._id,
    amount: 400, platformFee: 60, workerAmount: 340, status: 'paid',
  });
  const review = await Review.create({
    bookingId: booking._id, customerId: user._id, workerId: worker._id,
    rating: 5, comment: 'Excellent work!',
  });
  const chat = await Chat.create({
    bookingId: booking._id, senderId: user._id,
    senderModel: 'User', message: 'On my way!',
  });

  ids = { userId: user._id, workerId: worker._id, bookingId: booking._id,
          paymentId: payment._id, reviewId: review._id, chatId: chat._id };
  console.log(`\n✅ Test data created (Booking: ${booking._id})`);
}

async function verify() {
  const checks = [];

  // ── 1. Booking.populate('customerId') ────────────────────────
  const b1 = await Booking.findById(ids.bookingId).populate('customerId', 'name mobile');
  checks.push({ label: 'Booking.populate("customerId") — .name present', pass: typeof b1.customerId?.name === 'string' });
  checks.push({ label: 'Booking customerId is document (not ObjectId)', pass: b1.customerId?.constructor?.modelName === 'User' });

  // ── 2. Booking.populate('workerId') ──────────────────────────
  const b2 = await Booking.findById(ids.bookingId).populate('workerId', 'name mobile serviceCategory');
  checks.push({ label: 'Booking.populate("workerId") — .name present',   pass: typeof b2.workerId?.name === 'string' });
  checks.push({ label: 'Booking workerId is document (not ObjectId)',     pass: b2.workerId?.constructor?.modelName === 'Worker' });

  // ── 3. Payment.populate('bookingId') ─────────────────────────
  const p = await Payment.findById(ids.paymentId).populate('bookingId');
  checks.push({ label: 'Payment.populate("bookingId") — .serviceType present', pass: typeof p.bookingId?.serviceType === 'string' });
  checks.push({ label: 'Payment bookingId is document (not ObjectId)',          pass: p.bookingId?.constructor?.modelName === 'Booking' });

  // ── 4. Review.populate('bookingId') ──────────────────────────
  const r = await Review.findById(ids.reviewId).populate('bookingId');
  checks.push({ label: 'Review.populate("bookingId") — .status present', pass: typeof r.bookingId?.status === 'string' });
  checks.push({ label: 'Review bookingId is document (not ObjectId)',     pass: r.bookingId?.constructor?.modelName === 'Booking' });

  // ── 5. Chat.populate('bookingId') ────────────────────────────
  const c = await Chat.findById(ids.chatId).populate('bookingId');
  checks.push({ label: 'Chat.populate("bookingId") — .serviceType present', pass: typeof c.bookingId?.serviceType === 'string' });
  checks.push({ label: 'Chat bookingId is document (not ObjectId)',          pass: c.bookingId?.constructor?.modelName === 'Booking' });

  // ── No Mongoose overwrite ─────────────────────────────────────
  checks.push({ label: 'No Mongoose overwrite (single "Booking" model)', pass: Object.keys(mongoose.models).filter(k => k === 'Booking').length === 1 });

  // ── Print results ─────────────────────────────────────────────
  console.log('\n🧪 Populate Assertions:');
  let allPassed = true;
  for (const c of checks) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`   ${icon}  ${c.label}`);
    if (!c.pass) allPassed = false;
  }

  console.log(allPassed
    ? '\n✅ All populate assertions PASSED.\n'
    : '\n❌ Some assertions FAILED.\n'
  );
}

async function cleanup() {
  const { userId, workerId, bookingId, paymentId, reviewId, chatId } = ids;
  if (chatId)    await Chat.findByIdAndDelete(chatId);
  if (reviewId)  await Review.findByIdAndDelete(reviewId);
  if (paymentId) await Payment.findByIdAndDelete(paymentId);
  if (bookingId) await Booking.findByIdAndDelete(bookingId);
  if (workerId)  await Worker.findByIdAndDelete(workerId);
  if (userId)    await User.findByIdAndDelete(userId);
  console.log('🧹 Cleanup complete.');
  await mongoose.disconnect();
  console.log('✅ Disconnected.\n');
}

setup()
  .then(verify)
  .then(cleanup)
  .catch(async (err) => {
    console.error('\n❌ Verification error:', err.message);
    await cleanup().catch(() => {});
    process.exit(1);
  });
