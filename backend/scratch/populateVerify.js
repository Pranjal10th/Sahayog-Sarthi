// backend/scratch/populateVerify.js
// Actual populate integration test for Phase 3.2 approval
// Creates a real Worker + Booking, executes populate, verifies output, then cleans up

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// --- Import models via the PROXY paths (same as all app code uses) ---
import Worker from '../src/models/Worker.js';   // proxy → WorkerSchema.js
import Booking from '../src/models/Booking.js';
import User from '../src/models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let testWorkerId, testBookingId, testUserId;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅ MongoDB Connected');

  // ────────────────────────────────────────────────────────────
  // 1. Confirm which Mongoose model 'Worker' resolves to
  // ────────────────────────────────────────────────────────────
  const registeredModel = mongoose.model('Worker');
  console.log('\n📋 Model Registry Check:');
  console.log(`   mongoose.model('Worker') is defined:`, !!registeredModel);
  console.log(`   Model collection name:`, registeredModel.collection.collectionName);

  // ────────────────────────────────────────────────────────────
  // 2. Create a test User (required by Booking.customerId)
  // ────────────────────────────────────────────────────────────
  const testUser = await User.create({
    name: 'PopulateTest Customer',
    mobile: '8000000001',
  });
  testUserId = testUser._id;
  console.log(`\n✅ Test User created: ${testUser._id} — ${testUser.name}`);

  // ────────────────────────────────────────────────────────────
  // 3. Create a test Worker using the PROXY model
  // ────────────────────────────────────────────────────────────
  const testWorker = await Worker.create({
    name:            'Ramesh Electrician (Test)',
    mobile:          '9876543210',
    serviceCategory: 'Electrician',
    experience:      5,
    location: {
      type:        'Point',
      coordinates: [80.9462, 26.8467],  // Lucknow centre
    },
    hourlyRate: 300,
    kycStatus:  'approved',
    isAvailable: true,
  });
  testWorkerId = testWorker._id;
  console.log(`✅ Test Worker created via proxy model: ${testWorker._id} — ${testWorker.name}`);

  // ────────────────────────────────────────────────────────────
  // 4. Create a test Booking referencing the Worker
  // ────────────────────────────────────────────────────────────
  const testBooking = await Booking.create({
    customerId:      testUserId,
    workerId:        testWorkerId,
    serviceType:     'Electrician',
    amount:          300,
    customerAddress: '12 Test Lane, Lucknow',
    status:          'pending',
  });
  testBookingId = testBooking._id;
  console.log(`✅ Test Booking created: ${testBooking._id}`);
  console.log(`   workerId stored as ObjectId: ${testBooking.workerId}`);

  // ────────────────────────────────────────────────────────────
  // 5. Execute Booking.findById(...).populate('workerId')
  // ────────────────────────────────────────────────────────────
  console.log('\n🔍 Executing Booking.findById(...).populate("workerId")...');
  const populatedBooking = await Booking.findById(testBookingId).populate('workerId');

  const worker = populatedBooking.workerId;

  console.log('\n📦 Populated Result:');
  console.log('   typeof workerId            :', typeof worker);
  console.log('   workerId instanceof Object :', worker instanceof Object);
  console.log('   worker._id                 :', worker._id?.toString());
  console.log('   worker.name                :', worker.name);
  console.log('   worker.mobile              :', worker.mobile);
  console.log('   worker.serviceCategory     :', worker.serviceCategory);
  console.log('   worker.kycStatus           :', worker.kycStatus);
  console.log('   worker.isAvailable         :', worker.isAvailable);

  // ────────────────────────────────────────────────────────────
  // 6. Assertions
  // ────────────────────────────────────────────────────────────
  console.log('\n🧪 Assertions:');

  // A populated Mongoose document has a constructor.modelName set to the model name.
  // A raw ObjectId (unpopulated) would just be an ObjectId instance without modelName.
  const isPopulatedDoc = worker !== null
    && typeof worker === 'object'
    && worker.constructor?.modelName === 'Worker';

  const checks = [
    { label: 'workerId is populated as document (not raw ObjectId)', pass: isPopulatedDoc },
    { label: 'worker.name is present',                               pass: !!worker.name },
    { label: 'worker.mobile is present',                             pass: !!worker.mobile },
    { label: 'worker._id matches testWorkerId',                      pass: worker._id.toString() === testWorkerId.toString() },
    { label: 'No mongoose overwrite (single Worker model)',           pass: Object.keys(mongoose.models).filter(k => k === 'Worker').length === 1 },
  ];

  let allPassed = true;
  for (const c of checks) {
    const icon = c.pass ? '✅' : '❌';
    console.log(`   ${icon} ${c.label}`);
    if (!c.pass) allPassed = false;
  }

  console.log(allPassed
    ? '\n✅ All populate assertions PASSED — proxy Worker model resolves correctly.\n'
    : '\n❌ Some assertions FAILED.\n'
  );
}

async function cleanup() {
  if (testBookingId) await Booking.findByIdAndDelete(testBookingId);
  if (testWorkerId)  await Worker.findByIdAndDelete(testWorkerId);
  if (testUserId)    await User.findByIdAndDelete(testUserId);
  console.log('🧹 Cleanup: test Worker, Booking, and User removed from DB.');
  await mongoose.disconnect();
  console.log('✅ Disconnected.\n');
}

run()
  .then(cleanup)
  .catch(async (err) => {
    console.error('\n❌ Error during populate verification:', err.message);
    await cleanup().catch(() => {});
    process.exit(1);
  });
