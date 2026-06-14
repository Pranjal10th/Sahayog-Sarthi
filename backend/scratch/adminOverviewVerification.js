import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Worker from '../src/models/Worker.js';
import Booking from '../src/models/Booking.js';
import Payment from '../src/models/Payment.js';
// import { getAdminOverviewHub } from '../src/controllers/workerController.js';
import { getAdminOverviewUseCase } from '../src/modules/worker/infrastructure/di/container.js';

// Local implementation of legacy getAdminOverviewHub to avoid importing deleted files
const getAdminOverviewHubLocal = async () => {
  const totalUsers = await User.countDocuments();
  const activeWorkers = await Worker.countDocuments({ kycStatus: 'approved', isAvailable: true });
  const paymentsPaid = await Payment.find({ status: 'paid' });
  const platformRevenue = paymentsPaid.reduce((sum, current) => sum + (current.amount * 0.15), 0);
  const pendingWorkers = await Worker.find({ kycStatus: 'pending' });
  const liveBookings = await Booking.find({ 
    status: { $in: ['pending', 'accepted', 'in_progress'] } 
  }).sort({ createdAt: -1 });

  return {
    success: true,
    metrics: {
      totalUsers,
      activeWorkers,
      platformRevenue: parseFloat(platformRevenue.toFixed(2))
    },
    pendingWorkers,
    liveBookings
  };
};

dotenv.config();

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi');

  const testMobilePrefix = '999999';
  const makeMobile = (suffix) => `${testMobilePrefix}${suffix}`;

  let testUser1, testUser2, workerA, workerB, workerC, booking1, booking2, payment1, payment2;

  try {
    console.log('Seeding verification test data...');
    testUser1 = await User.create({ name: 'Test User 1', mobile: makeMobile('0001'), password: 'password123' });
    testUser2 = await User.create({ name: 'Test User 2', mobile: makeMobile('0002'), password: 'password123' });

    workerA = await Worker.create({
      name: 'Test Worker A',
      mobile: makeMobile('1001'),
      password: 'password123',
      kycStatus: 'approved',
      isAvailable: true,
      serviceCategory: 'plumbing',
      experience: 5,
      hourlyRate: 100,
      location: { type: 'Point', coordinates: [85.324, 27.717] }
    });

    workerB = await Worker.create({
      name: 'Test Worker B',
      mobile: makeMobile('1002'),
      password: 'password123',
      kycStatus: 'pending',
      isAvailable: false,
      serviceCategory: 'cleaning',
      experience: 3,
      hourlyRate: 80,
      location: { type: 'Point', coordinates: [85.324, 27.717] }
    });

    workerC = await Worker.create({
      name: 'Test Worker C',
      mobile: makeMobile('1003'),
      password: 'password123',
      kycStatus: 'approved',
      isAvailable: false,
      serviceCategory: 'plumbing',
      experience: 2,
      hourlyRate: 90,
      location: { type: 'Point', coordinates: [85.324, 27.717] }
    });

    booking1 = await Booking.create({
      customerId: testUser1._id,
      workerId: workerA._id,
      serviceType: 'plumbing',
      status: 'in_progress',
      amount: 500,
      customerAddress: 'Kathmandu, Nepal',
      bookingDate: new Date()
    });

    booking2 = await Booking.create({
      customerId: testUser1._id,
      workerId: workerA._id,
      serviceType: 'plumbing',
      status: 'completed',
      amount: 1000,
      customerAddress: 'Kathmandu, Nepal',
      bookingDate: new Date()
    });

    payment1 = await Payment.create({
      bookingId: booking2._id,
      customerId: testUser1._id,
      workerId: workerA._id,
      amount: 1000,
      workerAmount: 850,
      platformFee: 150,
      status: 'paid',
      paymentMethod: 'esewa'
    });

    payment2 = await Payment.create({
      bookingId: booking1._id,
      customerId: testUser1._id,
      workerId: workerA._id,
      amount: 500,
      workerAmount: 425,
      platformFee: 75,
      status: 'created',
      paymentMethod: 'esewa'
    });

    console.log('Test records seeded successfully.');

    // 1. Execute legacy controller local mock
    const legacyData = await getAdminOverviewHubLocal();

    // 2. Execute clean usecase
    const cleanOutput = await getAdminOverviewUseCase.execute();
    const cleanData = {
      success: true,
      ...cleanOutput
    };

    // 3. Serialize both outputs to POJO using standard JSON stringify/parse to simulate HTTP payload transmission
    const serializedLegacy = JSON.parse(JSON.stringify(legacyData));
    const serializedClean = JSON.parse(JSON.stringify(cleanData));

    // 4. Strict Deep Comparison
    const diffs = [];
    const checkDeep = (obj1, obj2, path = '') => {
      if (typeof obj1 !== typeof obj2) {
        diffs.push(`Type mismatch at "${path}": Legacy type "${typeof obj1}" vs Clean type "${typeof obj2}"`);
        return;
      }
      if (obj1 && typeof obj1 === 'object') {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        for (const k of new Set([...keys1, ...keys2])) {
          if (!(k in obj1)) {
            diffs.push(`Key "${k}" exists in Clean payload but is missing in Legacy payload at path "${path}"`);
          } else if (!(k in obj2)) {
            diffs.push(`Key "${k}" exists in Legacy payload but is missing in Clean payload at path "${path}"`);
          } else {
            checkDeep(obj1[k], obj2[k], path ? `${path}.${k}` : k);
          }
        }
      } else {
        if (obj1 !== obj2) {
          diffs.push(`Value mismatch at "${path}": Legacy value "${obj1}" vs Clean value "${obj2}"`);
        }
      }
    };

    checkDeep(serializedLegacy, serializedClean);

    if (diffs.length > 0) {
      console.error('❌ PAYLOAD MISMATCH DETECTED:');
      diffs.forEach(d => console.error(`  - ${d}`));
      throw new Error('Verification failed due to behavioral / serialization diffs.');
    }

    console.log('✅ SUCCESS: Both payloads are behaviorally, structurally, and value-wise identical.');
  } finally {
    console.log('Teardown: Cleaning up seeded records...');
    if (testUser1) await User.deleteOne({ _id: testUser1._id });
    if (testUser2) await User.deleteOne({ _id: testUser2._id });
    if (workerA) await Worker.deleteOne({ _id: workerA._id });
    if (workerB) await Worker.deleteOne({ _id: workerB._id });
    if (workerC) await Worker.deleteOne({ _id: workerC._id });
    if (booking1) await Booking.deleteOne({ _id: booking1._id });
    if (booking2) await Booking.deleteOne({ _id: booking2._id });
    if (payment1) await Payment.deleteOne({ _id: payment1._id });
    if (payment2) await Payment.deleteOne({ _id: payment2._id });

    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

run().catch(err => {
  console.error('Verification script crashed:', err);
  process.exit(1);
});
