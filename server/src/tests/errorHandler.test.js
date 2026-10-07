const assert = require('assert');
const express = require('express');
const http = require('http');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.post('/error/:type', (req, res, next) => {
  if (req.params.type === 'pdf') return next(new Error('Only PDF files are allowed.'));
  if (req.params.type === 'ai') {
    const error = new Error('Private upstream details must not be exposed.');
    error.statusCode = 502;
    error.isAiServiceError = true;
    return next(error);
  }
  if (req.params.type === 'internal') return next(new Error('Private internal details.'));
  return res.json({ success: true });
});
app.use(errorHandler);

const request = (server, path, body) => new Promise((resolve, reject) => {
  const payload = body === undefined ? '' : body;
  const req = http.request({
    host: '127.0.0.1',
    port: server.address().port,
    path,
    method: 'POST',
    headers: payload ? {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    } : {}
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
  });
  req.on('error', reject);
  if (payload) req.write(payload);
  req.end();
});

async function run() {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));

    const malformed = await request(server, '/error/none', '{invalid');
    assert.strictEqual(malformed.status, 400);
    assert.strictEqual(malformed.body.message, 'Request body must contain valid JSON.');
    assert.strictEqual(Object.hasOwn(malformed.body, 'stack'), false);

    const pdf = await request(server, '/error/pdf');
    assert.strictEqual(pdf.status, 400);
    assert.strictEqual(pdf.body.message, 'Only PDF resume files are allowed.');

    const ai = await request(server, '/error/ai');
    assert.strictEqual(ai.status, 502);
    assert.match(ai.body.message, /could not complete this request/i);
    assert.strictEqual(JSON.stringify(ai.body).includes('Private upstream details'), false);

    const internal = await request(server, '/error/internal');
    assert.strictEqual(internal.status, 500);
    assert.strictEqual(internal.body.message, 'An unexpected server error occurred. Please try again.');
    assert.strictEqual(JSON.stringify(internal.body).includes('Private internal details'), false);

    console.log('Error handling status, friendly messages, and response redaction tests passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error('Error handling tests failed:', error);
  process.exitCode = 1;
});
