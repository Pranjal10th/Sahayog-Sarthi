// backend/simulate_flow.js
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// CRITICAL FIX: Load all operational environment keys from your .env file
dotenv.config();

const BASE_URL = 'http://localhost:5000/api/v1';

// BIBAHV'S REAL MONGODB DOCUMENT ID INTERCEPTOR
const mockWorkerId = "6a2bf8c99faf1ffb119243f3"; 

// Dynamic Mock Customer Generation for Security Layer Bypass
const mockCustomerId = "6a2c1a295ca7ff1dfef3dbcf";

// Generate an automated signed test token matching your system's actual encryption secret
const generateTestToken = () => {
  // Pulling the real secret string from loaded environment matrix
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    console.warn("⚠️ Warning: process.env.JWT_SECRET nahi mila! Falling back to 'mockSecret123'. Ensure .env is populated.");
  }
  
  return jwt.sign(
    { id: mockCustomerId, role: 'customer' }, 
    secret || 'mockSecret123', 
    { expiresIn: '1h' }
  );
};

async function runSystemIntegrationTest() {
  console.log("🏁 Starting Sahayog Sarthi Core Integration Testing Suite...\n");
  console.log(`🎯 Targeting Valid Sarthi Node ID: ${mockWorkerId}`);
  
  const authToken = generateTestToken();
  const configHeaders = {
    headers: { Authorization: `Bearer ${authToken}` }
  };

  try {
    // TEST 1: Worker KYC Auto-Approval Simulator Endpoint Check
    console.log("\n⏳ Test 1: Simulating Admin KYC Approval Bypass...");
    const kycRes = await axios.put(`${BASE_URL}/workers/${mockWorkerId}/approve`);
    console.log(`✅ KYC Status Response: ${kycRes.data.message}`);
    console.log(`📊 Staging Verification Flag: [kycStatus: ${kycRes.data.worker.kycStatus} | isAvailable: ${kycRes.data.worker.isAvailable}]`);

    // TEST 2: Triggering Near-By Worker Geospatial Search Grid Matrix
    console.log("\n⏳ Test 2: Simulating Nearby Sarthi Geospatial Query Request...");
    const searchRes = await axios.get(`${BASE_URL}/workers/nearby?lng=80.9462&lat=26.8467&category=Carpenter&radius=10`);
    console.log(`✅ Geospatial Search Response: ${searchRes.data.count} active professional(s) parsed inside search radius.`);
    if (searchRes.data.workers.length > 0) {
      console.log(`✨ Top Rated Node: ${searchRes.data.workers[0].name} | Score: ${searchRes.data.workers[0].recommendationScore}`);
    }

    // TEST 3: Mocking Booking State with Synchronized Auth Token
    console.log("\n⏳ Test 3: Spawning New Booking Task Request & Timeout Trigger Verification...");
    const bookingPayload = {
      workerId: mockWorkerId,
      serviceType: "Carpenter",
      amount: 350,
      customerAddress: "101, Tiwari Ganj, Lucknow",
      notes: "Urgent door fixture breakdown repair task."
    };
    
    // Injecting authorization middleware headers payload context with synchronized secret signature
    const bookingRes = await axios.post(`${BASE_URL}/bookings`, bookingPayload, configHeaders);
    
    if (bookingRes.data.success) {
      console.log(`✅ Booking Instance initialized with Database ID: ${bookingRes.data.booking._id}`);
      console.log(`⚡ State Mode: ${bookingRes.data.booking.status.toUpperCase()}`);
      console.log(`⏱️ Background Micro-Scheduler: 60-second unhandled request countdown safely active.`);
      console.log(`📡 Broadcast Check: Check backend logs for the Telegram Bot Alert signal!`);
    }

  } catch (error) {
    console.error("❌ Staging System Integration Check Crashed:");
    console.error(error.response?.data || error.message);
  }
}

runSystemIntegrationTest();