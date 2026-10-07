const assert = require('assert');
const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const app = require('../app');
const User = require('../models/User');

const createEmptyPdf = () => {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n',
    '4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

async function postForm(port, token, form) {
  const response = await fetch(`http://127.0.0.1:${port}/api/analyses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  return { status: response.status, body: await response.json() };
}

async function run() {
  const mongod = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongod.getUri());
    const user = await User.create({
      name: 'Upload Test',
      email: `upload-${randomBytes(8).toString('hex')}@example.com`,
      passwordHash: 'test-hash'
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const jobDescription = 'A software engineering role requiring reliable API development.';

    const missing = await postForm(port, token, new FormData());
    assert.strictEqual(missing.status, 400);

    const nonPdfForm = new FormData();
    nonPdfForm.set('jobDescription', jobDescription);
    nonPdfForm.append('resume', new Blob(['synthetic non-PDF fixture'], { type: 'text/plain' }), 'resume.txt');
    const nonPdf = await postForm(port, token, nonPdfForm);
    assert.strictEqual(nonPdf.status, 400);
    assert.match(nonPdf.body.message, /Only PDF/);

    const oversizedForm = new FormData();
    oversizedForm.set('jobDescription', jobDescription);
    oversizedForm.append(
      'resume',
      new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: 'application/pdf' }),
      'large.pdf'
    );
    const oversized = await postForm(port, token, oversizedForm);
    assert.strictEqual(oversized.status, 400);
    assert.match(oversized.body.message, /5 MB/);

    const emptyPdfForm = new FormData();
    emptyPdfForm.set('jobDescription', jobDescription);
    emptyPdfForm.append('resume', new Blob([createEmptyPdf()], { type: 'application/pdf' }), 'empty.pdf');
    const emptyPdf = await postForm(port, token, emptyPdfForm);
    assert.strictEqual(emptyPdf.status, 400);
    assert.match(emptyPdf.body.message, /No readable text/);

    const malformed = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid'
    });
    const malformedBody = await malformed.json();
    assert.strictEqual(malformed.status, 400);
    assert.strictEqual(malformedBody.message, 'Request body must contain valid JSON.');
    assert.strictEqual(Object.hasOwn(malformedBody, 'stack'), false);
    console.log('Missing, non-PDF, oversized, empty-PDF, and malformed-JSON API cases passed.');
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
    await mongod.stop();
  }
}

run().catch((error) => {
  console.error('Upload validation tests failed:', error);
  process.exitCode = 1;
});
