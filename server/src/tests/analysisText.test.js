const assert = require('assert');
const http = require('http');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const geminiService = require('../services/geminiService');

const expectedResult = {
  overallScore: 87,
  breakdown: {
    keywordMatch: 85,
    skillsMatch: 90,
    experienceRelevance: 88,
    formatting: 84,
    education: 86
  },
  matchedKeywords: ['Node.js'],
  missingKeywords: [],
  strengths: ['Relevant experience'],
  suggestions: [],
  summary: 'Strong match.'
};
const analyzerCalls = [];
geminiService.analyzeResumeWithGemini = async (...args) => {
  analyzerCalls.push(args);
  return expectedResult;
};

process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const app = require('../app');
const User = require('../models/User');
const Analysis = require('../models/Analysis');

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

async function runAnalysisTextTests() {
  const mongod = await MongoMemoryServer.create();
  let server;

  try {
    await mongoose.connect(mongod.getUri());
    const [user, otherUser] = await User.create([
      { name: 'Text Analysis User', email: 'text-analysis@example.com', passwordHash: 'hash' },
      { name: 'Other User', email: 'other-analysis@example.com', passwordHash: 'hash' }
    ]);
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const token = makeToken(user._id);
    const otherToken = makeToken(otherUser._id);

    assert.strictEqual((await makeRequest(port, 'POST', '/api/analyses/text', null, {})).status, 401);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/analyses/text', token, {
      resumeText: 'Resume text',
      jobDescription: 'Too short'
    })).status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/analyses/text', token, {
      resumeText: 'Resume text',
      jobDescription: 'x'.repeat(20001)
    })).status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', '/api/analyses/text', token, {
      resumeText: 'Resume text',
      jobDescription: 'A valid job description with at least twenty characters.',
      mode: 'invalid'
    })).status, 400);
    assert.strictEqual(analyzerCalls.length, 0);

    const response = await makeRequest(port, 'POST', '/api/analyses/text', token, {
      resumeText: '  Generated resume body  ',
      jobDescription: '  A backend role requiring Node.js and API experience.  ',
      jobTitle: 'Backend Engineer',
      mode: 'internship'
    });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'Resume analysis completed successfully');
    assert.strictEqual(response.body.data.resumeText, 'Generated resume body');
    assert.match(response.body.data.resumeFileName, /\.txt$/);
    assert.strictEqual(response.body.data.mode, 'internship');
    assert.strictEqual(response.body.data.jobTitle, 'Backend Engineer');
    assert.deepStrictEqual(analyzerCalls[0], [
      'Generated resume body',
      'A backend role requiring Node.js and API experience.',
      'internship'
    ]);

    const analysisIds = [response.body.data._id];
    for (const mode of ['general', 'fresher', 'linkedin']) {
      const created = await makeRequest(port, 'POST', '/api/analyses/text', token, {
        resumeText: `Resume text for ${mode} mode with enough meaningful content.`,
        jobDescription: 'A software engineering role requiring Node.js and API experience.',
        mode
      });
      assert.strictEqual(created.status, 201);
      assert.strictEqual(created.body.data.mode, mode);
      analysisIds.push(created.body.data._id);
    }
    assert.strictEqual(analyzerCalls.length, 4);

    const paginated = await makeRequest(port, 'GET', '/api/analyses?page=1&limit=2', token);
    assert.strictEqual(paginated.status, 200);
    assert.strictEqual(paginated.body.count, 2);
    assert.strictEqual(paginated.body.total, 4);
    assert.strictEqual(paginated.body.pages, 2);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/${analysisIds[0]}`, token)).status, 200);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/${analysisIds[0]}`, otherToken)).status, 403);

    const persisted = await Analysis.findById(response.body.data._id);
    assert.ok(persisted);
    assert.strictEqual(persisted.userId.toString(), user._id.toString());
    assert.strictEqual(persisted.resumeFileName, response.body.data.resumeFileName);
    assert.deepStrictEqual(persisted.result, expectedResult);
    assert.strictEqual(response.body.data.parseability.length, 8);

    const invalidExpiry = await makeRequest(port, 'POST', `/api/analyses/${persisted.id}/share`, token, {
      expiresAt: '2020-01-01T00:00:00.000Z'
    });
    assert.strictEqual(invalidExpiry.status, 400);
    assert.strictEqual((await makeRequest(port, 'POST', `/api/analyses/${persisted.id}/share`, otherToken, {})).status, 404);

    const share = await makeRequest(port, 'POST', `/api/analyses/${persisted.id}/share`, token, {
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    });
    assert.strictEqual(share.status, 200);
    assert.match(share.body.data.token, /^[a-f0-9]{64}$/);
    const publicReport = await makeRequest(port, 'GET', `/api/analyses/shared/${share.body.data.token}`);
    assert.strictEqual(publicReport.status, 200);
    assert.strictEqual(publicReport.body.data.result.overallScore, expectedResult.overallScore);
    assert.strictEqual(publicReport.body.data.parseability.length, 8);
    for (const privateField of ['resumeText', 'resumeFileName', 'jobDescription', 'userId']) {
      assert.strictEqual(Object.hasOwn(publicReport.body.data, privateField), false);
    }
    const expiredRecord = await Analysis.findById(persisted.id).select('+shareToken');
    expiredRecord.shareExpiresAt = new Date(Date.now() - 1000);
    await expiredRecord.save();
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/shared/${share.body.data.token}`)).status, 404);

    const permanentShare = await makeRequest(port, 'POST', `/api/analyses/${persisted.id}/share`, token, {});
    assert.strictEqual(permanentShare.status, 200);
    assert.strictEqual(permanentShare.body.data.expiresAt, null);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/shared/${permanentShare.body.data.token}`)).status, 200);
    const revoked = await makeRequest(port, 'DELETE', `/api/analyses/${persisted.id}/share`, token);
    assert.strictEqual(revoked.status, 200);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/shared/${permanentShare.body.data.token}`)).status, 404);
    assert.strictEqual((await makeRequest(port, 'GET', '/api/analyses/shared/invalid-token')).status, 404);

    assert.strictEqual((await makeRequest(port, 'DELETE', `/api/analyses/${analysisIds[1]}`, token)).status, 200);
    assert.strictEqual((await makeRequest(port, 'GET', `/api/analyses/${analysisIds[1]}`, token)).status, 404);

    console.log('Analysis modes, pagination, ownership, deletion, parseability, and share-link tests passed.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    await mongod.stop();
  }
}

runAnalysisTextTests().catch((error) => {
  console.error('Generated-text analysis tests failed:', error);
  process.exitCode = 1;
});
