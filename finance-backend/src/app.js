const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// ─── Route Imports ───────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

// ─── App Initialization ─────────────────────────────────────────
const app = express();

// ─── Security Middleware ─────────────────────────────────────────
// Set security HTTP headers
app.use(helmet());

// Enable CORS with configurable origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Rate limiting - protect against brute force attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────────────────────
// Parse JSON request bodies (with size limit)
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Data Sanitization ───────────────────────────────────────────
// Sanitize MongoDB query injection
try {
  app.use(mongoSanitize());
} catch (e) {
  // mongo-sanitize may not be installed, skip gracefully
}

// Sanitize XSS (cross-site scripting) in request body
try {
  app.use(xss());
} catch (e) {
  // xss-clean may not be installed, skip gracefully
}

// ─── Logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── API Routes ──────────────────────────────────────────────────
const API_VERSION = 'v1';

// Health check endpoint
app.get(`/api/${API_VERSION}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Finance Dashboard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Dashboard Backend API',
    version: '1.0.0',
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      users: `/api/${API_VERSION}/users`,
      records: `/api/${API_VERSION}/records`,
      dashboard: `/api/${API_VERSION}/dashboard`,
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// Mount route modules
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/records`, recordRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────
// Handle requests to undefined routes
app.use((req, res, next) => {
  next(
    new ApiError(
      404,
      `Cannot find ${req.method} ${req.originalUrl} on this server.`
    )
  );
});

// ─── Global Error Handler ────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
