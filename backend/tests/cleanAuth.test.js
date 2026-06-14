import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Import new Clean Architecture Auth routing & Mongoose Schema
import authRoutes from '../src/modules/auth/interfaces/http/routes/authRoutes.js';
import UserSchema from '../src/modules/auth/infrastructure/persistence/schemas/UserSchema.js';
import Worker from '../src/models/Worker.js'; // Use legacy Worker since we don't migrate it
import { globalOtpStore } from '../src/modules/auth/infrastructure/di/container.js';

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Clean Architecture Auth Module Integration Tests (Phase 3.1)', () => {
  let dbConnection;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sahayog-sarthi-test';
    dbConnection = await mongoose.connect(mongoUri);

    // Clean up test collections
    await UserSchema.deleteMany({});
    await Worker.deleteMany({});
  });

  afterAll(async () => {
    await UserSchema.deleteMany({});
    await Worker.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/send-otp', () => {
    it('should fail if mobile is missing or not 10 digits', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please provide a valid 10-digit mobile number.');
    });

    it('should succeed to simulate OTP sending for a valid 10-digit mobile number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile: '9999991234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('OTP sent successfully (Simulated)');

      // Verify OTP exists in global store
      const record = await globalOtpStore.get('9999991234');
      expect(record).toBeDefined();
      expect(record.otp).toHaveLength(6);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should fail if mobile or OTP is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile: '9999991234' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Mobile number and OTP are required.');
    });

    it('should fail if OTP is incorrect', async () => {
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile: '9999992222' });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile: '9999992222', otp: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid OTP code.');
    });

    it('should return newCustomer flag if OTP verified but user does not exist and no name is provided', async () => {
      const mobile = '9999993333';
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile });

      const record = await globalOtpStore.get(mobile);
      expect(record).toBeDefined();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile, otp: record.otp });

      expect(res.status).toBe(200);
      expect(res.body.newCustomer).toBe(true);
      expect(res.body.message).toBe('OTP verified. Profile creation required.');

      // In-memory OTP store should NOT be cleared yet for newCustomer registration
      const recordAfter = await globalOtpStore.get(mobile);
      expect(recordAfter).toBeDefined();
    });

    it('should register and return token + customer if OTP is verified, user does not exist, and name is provided', async () => {
      const mobile = '9999994444';
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile });

      const record = await globalOtpStore.get(mobile);
      
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile, otp: record.otp, name: 'New Customer' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('customer');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('New Customer');
      expect(res.body.user.mobile).toBe(mobile);

      // Verify stored in DB
      const userInDb = await UserSchema.findOne({ mobile });
      expect(userInDb).toBeDefined();
      expect(userInDb.name).toBe('New Customer');
    });

    it('should login and return token + customer if user already exists', async () => {
      const mobile = '9999995555';
      
      // Seed user directly
      await UserSchema.create({ name: 'Existing Customer', mobile });

      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ mobile });

      const record = await globalOtpStore.get(mobile);
      
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ mobile, otp: record.otp });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('customer');
      expect(res.body.user.name).toBe('Existing Customer');
    });
  });

  describe('POST /api/v1/auth/register/worker', () => {
    it('should fail if missing mandatory fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/worker')
        .send({ name: 'Sarthi One', mobile: '8888881234' }); // Missing hourly rate, category, etc.

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields including GPS coordinates are mandatory.');
    });

    it('should register a new worker successfully and return JWT token', async () => {
      const payload = {
        name: 'Sarthi Electrician',
        mobile: '8888881111',
        serviceCategory: 'Electrician',
        experience: 5,
        hourlyRate: 200,
        longitude: 77.2090,
        latitude: 28.6139
      };

      const res = await request(app)
        .post('/api/v1/auth/register/worker')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.role).toBe('worker');
      expect(res.body.worker).toBeDefined();
      expect(res.body.worker.name).toBe('Sarthi Electrician');
      expect(res.body.worker.kycStatus).toBe('pending');
      expect(res.body.worker.location.coordinates).toEqual([77.2090, 28.6139]);

      // Check Mongoose DB
      const workerInDb = await Worker.findOne({ mobile: '8888881111' });
      expect(workerInDb).toBeDefined();
      expect(workerInDb.serviceCategory).toBe('Electrician');
    });

    it('should fail if worker mobile already exists', async () => {
      const payload = {
        name: 'Sarthi Electrician Dup',
        mobile: '8888881111', // Same mobile as previous test
        serviceCategory: 'Electrician',
        experience: 2,
        hourlyRate: 180,
        longitude: 77.2090,
        latitude: 28.6139
      };

      const res = await request(app)
        .post('/api/v1/auth/register/worker')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Worker with this mobile already exists.');
    });
  });
});
