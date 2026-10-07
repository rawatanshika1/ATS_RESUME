const assert = require('assert');
const http = require('http');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const app = require('../app');
const User = require('../models/User');
const Resume = require('../models/Resume');

const jwtSecret = process.env.JWT_SECRET;
const makeToken = (id) => jwt.sign({ id }, jwtSecret);

const makeRequest = (port, method, path, token, body) => new Promise((resolve, reject) => {
  const payload = body === undefined ? null : JSON.stringify(body);
  const request = http.request({
    hostname: '127.0.0.1',
    port,
    path,
    method,
    headers: {
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        resolve({ status: response.statusCode, body: JSON.parse(data) });
      } catch (error) {
        reject(error);
      }
    });
  });
  request.on('error', reject);
  if (payload) request.write(payload);
  request.end();
});

async function runResumeRouteTests() {
  const mongod = await MongoMemoryServer.create();
  let server;

  try {
    await mongoose.connect(mongod.getUri());
    const [owner, otherUser] = await User.create([
      { name: 'Resume Owner', email: 'owner@example.com', passwordHash: 'hash' },
      { name: 'Other User', email: 'other@example.com', passwordHash: 'hash' }
    ]);
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const ownerToken = makeToken(owner._id);
    const otherToken = makeToken(otherUser._id);

    assert.strictEqual((await makeRequest(port, 'GET', '/api/resumes')).status, 401);

    const invalid = await makeRequest(port, 'POST', '/api/resumes', ownerToken, { title: '' });
    assert.strictEqual(invalid.status, 400);

    const created = await makeRequest(port, 'POST', '/api/resumes', ownerToken, {
      title: 'Software Engineer',
      templateId: 'modern',
      sections: {
        personalInfo: { fullName: 'Taylor Example', email: 'taylor@example.com' },
        summary: 'A backend engineer.',
        skills: ['Node.js', { name: 'MongoDB', level: 'advanced' }],
        experience: [{ company: 'Example Co', title: 'Engineer', bullets: ['Built APIs'] }],
        projects: [{ name: 'Resume Builder', url: 'https://example.com' }],
        education: [{ institution: 'Example University', degree: 'BS' }],
        certifications: [{ name: 'Cloud Certificate', issuer: 'Example' }]
      }
    });
    assert.strictEqual(created.status, 201);
    const resumeId = created.body.data.id;
    assert.ok(resumeId);
    assert.strictEqual(created.body.data.userId, undefined);
    assert.strictEqual(created.body.data.__v, undefined);
    assert.deepStrictEqual(created.body.data.sections.skills[1], { name: 'MongoDB', level: 'advanced' });

    const ownedResume = await Resume.create({
      userId: otherUser._id,
      title: 'Private',
      templateId: 'classic'
    });

    const list = await makeRequest(port, 'GET', '/api/resumes', ownerToken);
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.body.count, 1);
    assert.strictEqual(list.body.data[0].id, resumeId);

    const read = await makeRequest(port, 'GET', `/api/resumes/${resumeId}`, ownerToken);
    assert.strictEqual(read.status, 200);
    assert.strictEqual(read.body.data.sections.experience[0].company, 'Example Co');

    const forbiddenRead = await makeRequest(port, 'GET', `/api/resumes/${resumeId}`, otherToken);
    assert.strictEqual(forbiddenRead.status, 404);
    const forbiddenUpdate = await makeRequest(port, 'PATCH', `/api/resumes/${resumeId}`, otherToken, { title: 'Hijack' });
    assert.strictEqual(forbiddenUpdate.status, 404);
    const forbiddenDelete = await makeRequest(port, 'DELETE', `/api/resumes/${resumeId}`, otherToken);
    assert.strictEqual(forbiddenDelete.status, 404);

    const updated = await makeRequest(port, 'PATCH', `/api/resumes/${resumeId}`, ownerToken, {
      title: 'Senior Software Engineer',
      sections: { summary: 'Updated summary.' }
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual(updated.body.data.title, 'Senior Software Engineer');
    assert.strictEqual(updated.body.data.sections.summary, 'Updated summary.');
    assert.strictEqual(updated.body.data.sections.personalInfo.fullName, 'Taylor Example');

    const deleted = await makeRequest(port, 'DELETE', `/api/resumes/${resumeId}`, ownerToken);
    assert.strictEqual(deleted.status, 200);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/resumes/${resumeId}`, ownerToken)).status, 404);
    assert.ok(await Resume.findById(ownedResume._id));

    console.log('Resume CRUD and ownership tests passed.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    await mongod.stop();
  }
}

runResumeRouteTests().catch((error) => {
  console.error('Resume route tests failed:', error);
  process.exitCode = 1;
});
