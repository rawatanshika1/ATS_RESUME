const assert = require('assert');
const http = require('http');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const resumeAiService = require('../services/resumeAiService');

const calls = [];
resumeAiService.generateResumeAiContent = async (action, input) => {
  calls.push({ action, input });
  if (action === 'improveBullet') return { rewrites: ['Improved bullet [X%].', 'Delivered improved outcome.', 'Optimized a documented process.'] };
  if (action === 'tailor') return { summary: 'A tailored summary.', skills: ['Node.js'] };
  if (action === 'coverLetter') return { coverLetter: 'Dear Hiring Manager,\n\nA grounded cover letter.' };
  if (action === 'interviewQuestions') {
    const question = (prefix, index) => ({ question: `${prefix} question ${index + 1}?`, answerTip: 'Use a truthful example.' });
    return {
      technicalQuestions: Array.from({ length: 10 }, (_, index) => question('Technical', index)),
      hrQuestions: Array.from({ length: 5 }, (_, index) => question('HR', index))
    };
  }
  return { roadmap: [{ keyword: 'Kubernetes', priority: 'medium', gap: 'Not evidenced yet.', action: 'Complete a guided deployment project.', timeframe: '2-3 weeks' }] };
};

process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const app = require('../app');
const User = require('../models/User');
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

async function runResumeAiRouteTests() {
  const mongod = await MongoMemoryServer.create();
  let server;

  try {
    await mongoose.connect(mongod.getUri());
    const user = await User.create({
      name: 'Resume AI User',
      email: 'resume-ai@example.com',
      passwordHash: 'hash'
    });
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const token = makeToken(user._id);
    const baseInput = { resumeText: 'Experienced software engineer with Node.js project experience.' };
    const jobDescription = 'Build reliable services with Node.js and cloud infrastructure experience.';

    assert.strictEqual((await makeRequest(port, 'POST', '/api/resumes/ai', null, {
      ...baseInput,
      action: 'tailor',
      jobDescription
    })).status, 401);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/resumes/ai', token, {
      ...baseInput,
      action: 'unknown',
      jobDescription
    })).status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/resumes/ai', token, {
      ...baseInput,
      action: 'tailor',
      jobDescription: 'Too short'
    })).status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/resumes/ai', token, {
      ...baseInput,
      action: 'improveBullet'
    })).status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/resumes/ai', token, {
      ...baseInput,
      action: 'coverLetter',
      jobDescription,
      tone: 'casual'
    })).status, 400);
    assert.strictEqual(calls.length, 0);

    const requests = [
      { action: 'improveBullet', bullet: 'Built an API', jobDescription },
      { action: 'tailor', jobDescription },
      { action: 'coverLetter', jobDescription, tone: 'friendly' },
      { action: 'interviewQuestions', jobDescription },
      { action: 'skillRoadmap', jobDescription }
    ];
    const responses = [];
    for (const request of requests) {
      responses.push(await makeRequest(port, 'POST', '/api/resumes/ai', token, { ...baseInput, ...request }));
    }

    assert.ok(responses.every((response) => response.status === 200 && response.body.success));
    assert.strictEqual(responses[0].body.data.rewrites.length, 3);
    assert.strictEqual(responses[1].body.data.summary, 'A tailored summary.');
    assert.strictEqual(responses[2].body.data.coverLetter.includes('Dear Hiring Manager'), true);
    assert.strictEqual(responses[3].body.data.technicalQuestions.length, 10);
    assert.strictEqual(responses[3].body.data.hrQuestions.length, 5);
    assert.deepStrictEqual(calls.map((call) => call.action), requests.map((request) => request.action));
    assert.strictEqual(calls[2].input.tone, 'friendly');
    assert.strictEqual(calls[0].input.bullet, 'Built an API');

    console.info('Resume AI route authentication, validation, and action tests passed.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    await mongod.stop();
  }
}

runResumeAiRouteTests().catch((error) => {
  console.error('Resume AI route tests failed:', error);
  process.exitCode = 1;
});
