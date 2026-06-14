// backend/scratch/verifyApis.js
import http from 'http';

function post(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    console.log('=== TEST 1: POST /api/v1/auth/send-otp ===');
    const sendOtpRes = await post('/api/v1/auth/send-otp', { mobile: '9999999988' });
    console.log('Status Code:', sendOtpRes.statusCode);
    console.log('Response Body:', sendOtpRes.body);
    console.log();

    console.log('=== TEST 2: POST /api/v1/auth/verify-otp (New Customer profile check) ===');
    // We don't have the generated OTP code easily, but we can verify that sending an invalid OTP yields 401:
    const verifyOtpResFail = await post('/api/v1/auth/verify-otp', { mobile: '9999999988', otp: '000000' });
    console.log('Status Code:', verifyOtpResFail.statusCode);
    console.log('Response Body:', verifyOtpResFail.body);
    console.log();

    console.log('=== TEST 3: POST /api/v1/auth/register/worker ===');
    // Register worker with correct fields
    const registerWorkerRes = await post('/api/v1/auth/register/worker', {
      name: 'Manual Sarthi Test',
      mobile: '8888889988',
      serviceCategory: 'Electrician',
      experience: 4,
      hourlyRate: 180,
      longitude: 77.2090,
      latitude: 28.6139
    });
    console.log('Status Code:', registerWorkerRes.statusCode);
    console.log('Response Body:', registerWorkerRes.body);
    console.log();

    console.log('=== TEST 4: POST /api/v1/auth/register/worker (Duplicate check) ===');
    const registerWorkerResDup = await post('/api/v1/auth/register/worker', {
      name: 'Manual Sarthi Test Dup',
      mobile: '8888889988',
      serviceCategory: 'Electrician',
      experience: 4,
      hourlyRate: 180,
      longitude: 77.2090,
      latitude: 28.6139
    });
    console.log('Status Code:', registerWorkerResDup.statusCode);
    console.log('Response Body:', registerWorkerResDup.body);
    console.log();

  } catch (error) {
    console.error('Error during verification:', error);
  }
}

run();
