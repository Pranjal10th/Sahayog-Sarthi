// Geospatial + populate smoke-test verification script
// Run: node --input-type=module < scratch/verifyWorkerModule.js
// OR:  node scratch/verifyWorkerModule.js (if .env is loaded)

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

// Import clean-module WorkerSchema
import Worker from '../src/modules/worker/infrastructure/persistence/schemas/WorkerSchema.js';
import Booking from '../src/models/Booking.js';

async function verify() {
  await mongoose.connect(MONGO_URI);
  console.log('\n✅ MongoDB Connected\n');

  // 1. Check 2dsphere index exists on workers collection
  const indexes = await mongoose.connection.collection('workers').indexes();
  const geo = indexes.find(idx => idx.key?.location === '2dsphere');
  if (geo) {
    console.log('✅ GEOSPATIAL: 2dsphere index confirmed on workers collection');
    console.log('   Index:', JSON.stringify(geo.key));
  } else {
    console.error('❌ GEOSPATIAL: 2dsphere index NOT found on workers collection');
  }

  // 2. Mongoose overwrite guard — model should already exist in registry
  const workerModelName = mongoose.modelNames().includes('Worker');
  if (workerModelName) {
    console.log('✅ MODEL REGISTRY: Worker model is registered without overwrite error');
  } else {
    console.error('❌ MODEL REGISTRY: Worker model not found in Mongoose registry');
  }

  // 3. Booking.populate('workerId') test
  const sampleBooking = await Booking.findOne({ workerId: { $exists: true } })
    .populate('workerId', 'name mobile serviceCategory');

  if (sampleBooking) {
    const populated = sampleBooking.workerId;
    if (populated && typeof populated === 'object' && populated.name) {
      console.log(`✅ POPULATE: Booking.populate('workerId') works — Sarthi: ${populated.name} (${populated.serviceCategory})`);
    } else if (sampleBooking.workerId) {
      console.log('⚠️  POPULATE: workerId is an ObjectId (no worker found for this booking ID in DB)');
    }
  } else {
    console.log('ℹ️  POPULATE: No bookings found in DB — populate test skipped (expected on fresh DB)');
  }

  // 4. Worker count
  const count = await Worker.countDocuments();
  console.log(`ℹ️  WORKER COUNT: ${count} workers in collection`);

  await mongoose.disconnect();
  console.log('\n✅ Verification complete.\n');
}

verify().catch(err => {
  console.error('❌ Verification error:', err.message);
  process.exit(1);
});
