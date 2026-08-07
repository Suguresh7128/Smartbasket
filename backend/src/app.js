require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const cron = require('node-cron');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const connectRedis = require('./config/redis');
require('./config/passport');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const priceRoutes = require('./routes/prices');
const billRoutes = require('./routes/bills');
const alertRoutes = require('./routes/alerts');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const locationRoutes = require('./routes/location');
const storeRoutes = require('./routes/stores');

// Job imports
const { checkAlerts } = require('./jobs/alertChecker');

const app = express();

// ─── Connect to databases ───────────────────────────────────────
connectDB();
connectRedis();

mongoose.set('bufferCommands', false);

// ─── Security & parsing middleware ─────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: [process.env.CLIENT_URL, 'exp://localhost:8081', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─── Graceful degraded mode when MongoDB is not connected ───────────
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Please configure MONGODB_URI or start MongoDB.',
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(passport.initialize());

// ─── Health check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/location', locationRoutes);

// ─── 404 handler ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.stack}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Scheduled Jobs ──────────────────────────────────────────────
// Check price alerts every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Running alert checker...');
  await checkAlerts();
});

// ─── Start server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🛒 SmartBasket API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
