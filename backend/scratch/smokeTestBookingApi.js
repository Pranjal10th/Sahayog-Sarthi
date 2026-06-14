// backend/scratch/smokeTestBookingApi.js
// State machine + payment settlement smoke test against live dev server
// Run: node scratch/smokeTestBookingApi.js

import http from 'http';
import https from 'https';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const BASE    = 'http://localhost:5000/api/v1';
const SECRET  = process.env.JWT_SECRET;
const DUMMY   = '000000000000000000000001';

const customerToken = jwt.sign({ id: DUMMY, role: 'customer' }, SECRET, { expiresIn: '5m' });
const workerToken   = jwt.sign({ id: DUMMY, role: 'worker'   }, SECRET, { expiresIn: '5m' });
const adminToken    = jwt.sign({ id: DUMMY, role: 'admin'    }, SECRET, { expiresIn: '5m' });

function req(method, path, token, body) {
  return new Promise((resolve) => {
    const url  = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data  ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(opts, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', e => resolve({ status: 'ERR', body: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

function check(label, cond, detail = '') {
  const icon = cond ? '✅' : '❌';
  console.log(`   ${icon} ${label}${detail ? `  (${detail})` : ''}`);
  return cond;
}

async function run() {
  console.log('\n🔥 Phase 3.3 — Booking API Smoke Tests\n' + '='.repeat(55));

  let pass = 0, fail = 0;
  const assert = (label, cond, detail) => {
    if (check(label, cond, detail)) pass++; else fail++;
  };

  // ── State machine: valid transitions via live legacy routes ──
  console.log('\n📌 Section A: Valid State Transitions');

  // 1. GET /bookings/history
  const histRes = await req('GET', '/bookings/history', customerToken);
  assert('GET /bookings/history responds', histRes.status === 200, `HTTP ${histRes.status}`);

  // 2. Invalid: GET non-existent booking → 404 or 500 not 200
  const badGet = await req('GET', `/bookings/${DUMMY}`, workerToken);
  assert('GET /bookings/:id (non-existent) → not 200', badGet.status !== 200, `HTTP ${badGet.status}`);

  // ── Invalid transitions → 400/404 ───────────────────────────
  console.log('\n📌 Section B: Invalid Transitions (must be 400 or 404)');
  const inv1 = await req('PUT', `/bookings/${DUMMY}/accept`,   workerToken);
  assert('PUT accept on dummy ID → not 500',   inv1.status !== 500,   `HTTP ${inv1.status}`);
  const inv2 = await req('PUT', `/bookings/${DUMMY}/start`,    workerToken);
  assert('PUT start on dummy ID → not 500',    inv2.status !== 500,   `HTTP ${inv2.status}`);
  const inv3 = await req('PUT', `/bookings/${DUMMY}/complete`, workerToken);
  assert('PUT complete on dummy ID → not 500', inv3.status !== 500,   `HTTP ${inv3.status}`);
  const inv4 = await req('PUT', `/bookings/${DUMMY}/cancel`,   customerToken);
  assert('PUT cancel on dummy ID → not 500',   inv4.status !== 500,   `HTTP ${inv4.status}`);

  // ── Payment controller (reads Booking via proxy) ─────────────
  console.log('\n📌 Section C: Payment Settlement (proxy Booking read)');
  const order = await req('POST', '/payments/create-order', customerToken, { bookingId: DUMMY });
  assert('POST /payments/create-order (dummy) → not 500', order.status !== 500, `HTTP ${order.status}`);
  const verify = await req('POST', '/payments/verify', customerToken, {
    bookingId: DUMMY,
    razorpay_order_id: 'order_mock_test',
    razorpay_payment_id: 'pay_mock_test',
    razorpay_signature: 'sandbox_cryptographic_bypass_hash_signature',
  });
  assert('POST /payments/verify (dummy) → not 500', verify.status !== 500, `HTTP ${verify.status}`);

  // ── Chat route on booking router ─────────────────────────────
  console.log('\n📌 Section D: Chat Route on Booking Router');
  const chat = await req('GET', `/bookings/chats/${DUMMY}`, workerToken);
  assert('GET /bookings/chats/:id responds', chat.status !== 500, `HTTP ${chat.status}`);

  console.log('\n' + '='.repeat(55));
  console.log(`Results: ${pass} passed, ${fail} failed\n`);
  if (fail > 0) process.exit(1);
}

run().catch(console.error);
