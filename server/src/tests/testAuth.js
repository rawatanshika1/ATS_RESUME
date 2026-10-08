const http = require('http');
const { randomBytes } = require('crypto');
const mongoose = require('mongoose');
process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const app = require('../app');

async function runAuthTests() {
  const testPassword = randomBytes(24).toString('base64url');
  console.info('--- STARTING PHASE 2 AUTH TESTS ---');
  let mongod = null;
  
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.info('Connected to In-Memory MongoDB for testing:', uri);
  } catch (err) {
    console.info('MongoMemoryServer fallback to standard URI:', err.message);
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ats_resume_analyzer_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
  }

  const PORT = 5098;
  const server = app.listen(PORT, async () => {
    try {
      // 1. Test Register
      const regRes = await makeRequest('POST', `http://localhost:${PORT}/api/auth/register`, {
        name: 'Test Candidate',
        email: 'testuser@example.com',
        password: testPassword
      });
      console.info('1. Register response code:', regRes.statusCode);
      if (regRes.statusCode !== 201 || !regRes.body.token) {
        throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`);
      }
      const token = regRes.body.token;

      // 2. Test Register Duplicate
      const dupRes = await makeRequest('POST', `http://localhost:${PORT}/api/auth/register`, {
        name: 'Test Candidate 2',
        email: 'testuser@example.com',
        password: testPassword
      });
      console.info('2. Duplicate Register code:', dupRes.statusCode);
      if (dupRes.statusCode !== 400) {
        throw new Error(`Duplicate register should return 400, got ${dupRes.statusCode}`);
      }

      // 3. Test Login
      const loginRes = await makeRequest('POST', `http://localhost:${PORT}/api/auth/login`, {
        email: 'testuser@example.com',
        password: testPassword
      });
      console.info('3. Login response code:', loginRes.statusCode);
      if (loginRes.statusCode !== 200 || !loginRes.body.token) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
      }

      // 4. Test GET /api/auth/me with Bearer token
      const meRes = await makeRequest('GET', `http://localhost:${PORT}/api/auth/me`, null, {
        'Authorization': `Bearer ${token}`
      });
      console.info('4. GET /me response code:', meRes.statusCode);
      if (meRes.statusCode !== 200 || meRes.body.user.email !== 'testuser@example.com') {
        throw new Error(`Get me failed: ${JSON.stringify(meRes.body)}`);
      }

      console.info('✅ ALL PHASE 2 AUTH TESTS PASSED SUCCESSFULLY!');
      server.close();
      if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
      if (mongod) await mongod.stop();
      process.exit(0);
    } catch (err) {
      console.error('❌ AUTH TEST FAILED:', err.message);
      server.close();
      if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
      if (mongod) await mongod.stop();
      process.exit(1);
    }
  });
}

function makeRequest(method, urlStr, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = body ? JSON.stringify(body) : '';
    
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(postData);
    req.end();
  });
}

runAuthTests();
