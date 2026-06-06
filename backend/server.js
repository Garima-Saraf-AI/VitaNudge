require('dotenv').config();

// ── STARTUP GUARDS ──
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set — using insecure default. Set it in .env before going to production.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./database/init');
const { seedDatabase } = require('./database/seed');
const { startWeeklyEmailScheduler } = require('./services/weeklyEmailScheduler');

// ── INIT DB ──
initDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// ── RATE LIMITERS ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { error: 'Scan limit reached for this hour. Free plan allows 30 scans/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

const coachLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40,
  message: { error: 'Coach query limit reached. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// ── MIDDLEWARE ──
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '20mb' }));  // large for base64 images
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── ROUTES ──
app.use('/api/auth/login', loginLimiter);   // rate-limit before auth router
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/foods',     require('./routes/foods'));
app.use('/api/meals',     require('./routes/meals'));
app.use('/api/health',    require('./routes/health'));
app.use('/api/scan',      scanLimiter, require('./routes/scan'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/barcode',   require('./routes/barcode'));
app.use('/api/coach',     coachLimiter, require('./routes/coach'));
app.use('/api/export',    require('./routes/export'));
app.use('/api/billing',   require('./routes/billing'));

// ── SERVE FRONTEND in production ──
if (process.env.NODE_ENV === 'production') {
  const fp = path.join(__dirname, '../frontend/dist');
  app.use(express.static(fp));
  app.get('*', (req, res) => res.sendFile(path.join(fp, 'index.html')));
}

// ── HEALTH CHECK ──
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 VitaNudge API running on http://localhost:${PORT}`);
    console.log(`   Database: ${path.join(__dirname, 'database/nutritrack.db')}`);
  });

  startWeeklyEmailScheduler();
}

module.exports = app;
