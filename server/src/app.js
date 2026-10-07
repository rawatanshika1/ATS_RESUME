const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === clientUrl) {
      return callback(null, origin || false);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authRoutes = require('./routes/authRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AI Resume Analyzer API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/resumes', resumeRoutes);

// Central error handler
app.use(errorHandler);

module.exports = app;
