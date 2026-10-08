require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { getGeminiModel } = require('./services/geminiClient');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
server.timeout = 190000;
server.requestTimeout = 190000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

const startServer = async () => {
  let modelName;
  try {
    await connectDB();
    modelName = getGeminiModel();
  } catch (error) {
    console.error(`MongoDB connection failed. Server startup aborted: ${error.message}`);
    process.exit(1);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.info(`Gemini model in use: ${modelName}`);
    console.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection Error:', reason instanceof Error ? reason.stack : reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.stack || error);
  process.exit(1);
});

module.exports = server;
