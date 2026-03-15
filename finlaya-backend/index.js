const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim().replace(/\/$/, ''));

    if (!origin) return callback(null, true);

    if (allowed.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Swagger documentation
try {
  const swaggerPath = path.join(__dirname, 'swagger', 'swagger.yaml');
  const swaggerDocument = YAML.load(swaggerPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('✓ Swagger documentation loaded');
} catch (error) {
  console.warn('⚠ Could not load Swagger documentation:', error.message);
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FinLaya API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'FinLaya Backend API',
    version: '1.0.0',
    endpoints: {
      health:   '/health',
      docs:     '/api-docs',
      login:    'POST /auth/login',
      register: 'POST /auth/register',
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log(' FinLaya Backend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // ── Start report scheduler ───────────────────────────────────────────────
  const { startReportScheduler } = require('./jobs/reportScheduler');
  startReportScheduler();

  console.log('Press CTRL+C to stop the server');
  console.log('');
});

module.exports = app;