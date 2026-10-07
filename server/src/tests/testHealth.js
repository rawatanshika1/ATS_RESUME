const http = require('http');
const app = require('../app');

const server = app.listen(5099, async () => {
  http.get('http://localhost:5099/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HEALTH TEST RESULT:', res.statusCode, data);
      server.close();
      if (res.statusCode === 200 && data.includes('"status":"ok"')) {
        console.log('✅ Phase 1 Health Test Passed');
        process.exit(0);
      } else {
        console.error('❌ Phase 1 Health Test Failed');
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.error('Health test request error:', err);
    server.close();
    process.exit(1);
  });
});
