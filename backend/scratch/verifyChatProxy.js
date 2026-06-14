// backend/scratch/verifyChatProxy.js
// Verify Chat proxy model, clean module architecture, and route functionality

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Load the proxy model directly
import Chat from '../src/models/Chat.js';

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

  const testBookingId = new mongoose.Types.ObjectId();
  const testSenderId = new mongoose.Types.ObjectId();

  console.log('\n--- 1. Verification of Chat.create() and Chat.find() via Proxy ---');
  
  // Create a chat message
  const createdMsg = await Chat.create({
    bookingId: testBookingId,
    senderId: testSenderId,
    senderModel: 'User',
    message: 'Hello, this is a proxy verification message'
  });
  console.log('✅ Chat.create() completed successfully:', createdMsg);

  // Retrieve the chat message
  const foundMsgs = await Chat.find({ bookingId: testBookingId }).sort({ timestamp: 1 });
  console.log('✅ Chat.find() completed successfully. Retrieved count:', foundMsgs.length);
  if (foundMsgs.length !== 1 || foundMsgs[0].message !== 'Hello, this is a proxy verification message') {
    throw new Error('Chat message content mismatch on retrieval');
  }

  console.log('\n--- 2. Verification of GET /bookings/chats/:id Route via Live API ---');
  // Generate token
  const dummyUserToken = jwt.sign({ id: testSenderId.toString(), role: 'customer' }, SECRET, { expiresIn: '10m' });

  // Call API route
  const getRes = await apiCall('GET', `/bookings/chats/${testBookingId}`, dummyUserToken);
  console.log('✅ API call response status:', getRes.status);
  console.log('✅ API call response body messages count:', getRes.body.messages?.length);

  if (getRes.status !== 200) {
    throw new Error(`API call failed with status ${getRes.status}: ${JSON.stringify(getRes.body)}`);
  }
  if (!getRes.body.success || !Array.isArray(getRes.body.messages) || getRes.body.messages.length !== 1) {
    throw new Error(`API response body structure mismatch: ${JSON.stringify(getRes.body)}`);
  }
  if (getRes.body.messages[0].message !== 'Hello, this is a proxy verification message') {
    throw new Error('API response message content mismatch');
  }

  console.log('\n--- 3. Verification of socketService Chat Import Safety ---');
  // Dynamic import socketService to test import safety
  const socketService = await import('../src/services/socketService.js');
  console.log('✅ socketService imported successfully. Available exports:', Object.keys(socketService));

  // Cleanup
  await Chat.deleteMany({ bookingId: testBookingId });
  console.log('🧹 Cleaned up temporary test chat messages.');

  console.log('\n⭐⭐⭐ ALL CHAT VERIFICATIONS PASSED SUCCESSFULLY ⭐⭐⭐');
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
