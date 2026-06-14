// Smoke test: verifies all worker API endpoints return expected HTTP responses
// Run from backend dir: node scratch/smokeTestWorkerApi.js

import http from 'http';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const BASE = 'http://localhost:5000/api/v1';
const SECRET = process.env.JWT_SECRET;

// Generate admin token for protected endpoints
const adminToken = jwt.sign({ id: 'smoketest-admin', role: 'admin' }, SECRET, { expiresIn: '5m' });
const workerToken = jwt.sign({ id: 'smoketest-worker', role: 'worker' }, SECRET, { expiresIn: '5m' });

// A dummy worker ObjectId for smoke routes (404 is acceptable — proves routing works)
const DUMMY_ID = '000000000000000000000001';

function request(method, path, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 100) }));
    });
    req.on('error', (e) => resolve({ status: 'ERR', body: e.message }));
    req.end();
  });
}

async function run() {
  const tests = [
    { name: 'GET /workers/nearby',            method: 'GET', path: '/workers/nearby?lng=80.9462&lat=26.8467&radius=10', token: null },
    { name: 'GET /workers/:id/dashboard',     method: 'GET', path: `/workers/${DUMMY_ID}/dashboard`,                   token: workerToken },
    { name: 'PUT /workers/:id/approve',       method: 'PUT', path: `/workers/${DUMMY_ID}/approve`,                     token: adminToken },
    { name: 'PUT /workers/:id/reject',        method: 'PUT', path: `/workers/${DUMMY_ID}/reject`,                      token: adminToken },
    { name: 'PUT /workers/:id/block',         method: 'PUT', path: `/workers/${DUMMY_ID}/block`,                       token: adminToken },
    { name: 'PUT /workers/:id/unblock',       method: 'PUT', path: `/workers/${DUMMY_ID}/unblock`,                     token: adminToken },
  ];

  console.log('\n🔥 Worker API Smoke Tests\n' + '='.repeat(50));
  let pass = 0, fail = 0;

  for (const t of tests) {
    const r = await request(t.method, t.path, t.token);
    const ok = r.status !== 'ERR' && r.status !== 500 && r.status < 500;
    const icon = ok ? '✅' : '❌';
    const note = ok ? `HTTP ${r.status}` : `HTTP ${r.status} — FAIL`;
    console.log(`${icon}  ${t.name.padEnd(35)} ${note}`);
    if (r.status >= 500 || r.status === 'ERR') fail++;
    else pass++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${pass} passed, ${fail} failed\n`);
  if (fail > 0) process.exit(1);
}

run().catch(console.error);
