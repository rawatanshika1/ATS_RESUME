const assert = require('assert');
const http = require('http');
const app = require('../app');

const request = (server, { path, method = 'GET', headers = {} }) => new Promise((resolve, reject) => {
  const req = http.request({
    host: '127.0.0.1',
    port: server.address().port,
    path,
    method,
    headers
  }, (res) => {
    res.resume();
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
  });
  req.on('error', reject);
  req.end();
});

async function run() {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const health = await request(server, { path: '/api/health' });
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(health.headers['x-frame-options'], 'SAMEORIGIN');

    const allowedHealth = await request(server, {
      path: '/api/health',
      headers: { Origin: 'http://localhost:5173' }
    });
    assert.strictEqual(allowedHealth.headers['access-control-allow-origin'], 'http://localhost:5173');

    const allowedOptions = await request(server, {
      path: '/api/resumes',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PATCH'
      }
    });
    assert.strictEqual(allowedOptions.status, 204);
    assert.strictEqual(allowedOptions.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.match(allowedOptions.headers['access-control-allow-methods'], /PATCH/);

    const deniedOptions = await request(server, {
      path: '/api/resumes',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://untrusted.example',
        'Access-Control-Request-Method': 'PATCH'
      }
    });
    assert.strictEqual(deniedOptions.headers['access-control-allow-origin'], undefined);
    console.info('Helmet and CORS allow/deny tests passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error('Security middleware tests failed:', error);
  process.exitCode = 1;
});
