import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../../../../backend/src/models/User.js';
import { globalOtpStore } from '../../../../backend/src/modules/auth/infrastructure/di/container.js';
import { sendOtpUseCase, verifyOtpUseCase } from '../../../../backend/src/modules/auth/infrastructure/di/container.js';

dotenv.config();

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi');

  const testMobile = '9999990001';

  try {
    console.log('Cleaning up previous test user...');
    await User.deleteOne({ mobile: testMobile });

    // Step 1: Send OTP
    console.log('Step 1: Sending OTP...');
    await sendOtpUseCase.execute(testMobile);

    const record = await globalOtpStore.get(testMobile);
    if (!record) {
      throw new Error('OTP was not stored in globalOtpStore.');
    }
    console.log(`Stored OTP: ${record.otp}`);

    // Step 2: Verify OTP (First check: new customer onboarding)
    console.log('Step 2: Verifying OTP (without name)...');
    const firstRes = await verifyOtpUseCase.execute({ mobileStr: testMobile, otpCode: record.otp });
    console.log('First verify response:', firstRes);

    if (!firstRes.success || !firstRes.newCustomer) {
      throw new Error(`Expected newCustomer flag, got: ${JSON.stringify(firstRes)}`);
    }

    // Step 3: Verify OTP (Second check: submit with name)
    console.log('Step 3: Completing registration with name...');
    const secondRes = await verifyOtpUseCase.execute({ mobileStr: testMobile, otpCode: record.otp, name: 'Bibhav' });
    console.log('Second verify response:', secondRes);

    if (!secondRes.success || !secondRes.token || secondRes.user.name !== 'Bibhav') {
      throw new Error(`Expected successful registration with token, got: ${JSON.stringify(secondRes)}`);
    }

    console.log('✅ End-to-end registration flow verified successfully!');
  } finally {
    console.log('Cleaning up test user...');
    await User.deleteOne({ mobile: testMobile });
    await globalOtpStore.delete(testMobile);
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

run().catch(err => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
