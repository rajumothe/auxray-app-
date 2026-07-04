require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const auditLogMiddleware = require('./middlewares/auditLogMiddleware');

const app = express();

const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_SYNC_FORCE = process.env.DB_SYNC_FORCE === 'true';
const DB_SYNC_ALTER = process.env.DB_SYNC_ALTER === 'true';
const shouldSyncDb =
  process.env.DB_SYNC_ENABLED === 'true' ||
  (NODE_ENV !== 'production' && process.env.DB_SYNC_ENABLED !== 'false');
const shouldSeedOnStart =
  process.env.RUN_SEED_ON_START === 'true' ||
  (NODE_ENV !== 'production' && process.env.RUN_SEED_ON_START !== 'false');
const seedInitialData = require('./seed');

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || '';
  const parsed = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (parsed.length > 0) {
    return parsed;
  }

  if (NODE_ENV !== 'production') {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }

  return [];
};

const allowedOrigins = parseAllowedOrigins();
const allowAllOrigins = allowedOrigins.includes('*');

const corsOptions = {
  origin(origin, callback) {
    // Mobile/native and server-to-server requests may not send Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowAllOrigins || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('CORS origin not allowed'));
  },
  credentials: true,
};

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

// --- Middlewares ---
app.disable('x-powered-by');

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(cors(corsOptions));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(apiLimiter);
app.use(auditLogMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes'); 
const companyRoutes = require('./routes/companyRoutes');
const plantRoutes = require('./routes/plantRoutes'); 
const salesOfficeRoutes = require('./routes/salesOfficeRoutes');
const routeRoutes = require('./routes/routeRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const skuRoutes = require('./routes/skuRoutes');
const priceTaxRoutes = require('./routes/priceTaxRoutes');
const materialTypeRoutes = require('./routes/materialTypeRoutes');
const mobileRoutes = require('./routes/mobileRoutes');
const webListRoutes = require('./routes/webListRoutes');

// --- Use Routes ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/plants', plantRoutes); 
app.use('/api/sales-offices', salesOfficeRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/skus', skuRoutes);
app.use('/api/pricing', priceTaxRoutes);
app.use('/api/material-types', materialTypeRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/web-lists', webListRoutes);

// --- Health and Basic Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('Solar CRM API is running...');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin not allowed') {
    res.status(403).json({ message: err.message });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

const startServer = async () => {
  try {
    const jwtSecret = process.env.JWT_SECRET || '';
    const weakJwtSecret =
      jwtSecret.length < 32 ||
      jwtSecret.includes('your_super_secret') ||
      jwtSecret.includes('replace_with');

    if (NODE_ENV === 'production' && weakJwtSecret) {
      throw new Error('JWT_SECRET must be set to a strong value in production.');
    }

    if (NODE_ENV !== 'production' && weakJwtSecret) {
      console.warn('⚠️ Weak JWT_SECRET detected. Set a strong value before production deployment.');
    }

    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    if (shouldSyncDb) {
      await sequelize.sync({ force: DB_SYNC_FORCE, alter: DB_SYNC_FORCE ? false : DB_SYNC_ALTER });
      console.log('✅ Database synchronized.');
    } else {
      console.log('ℹ️  DB sync skipped (DB_SYNC_ENABLED=false).');
    }

    if (shouldSeedOnStart) {
      await seedInitialData();
      console.log('✅ Seed completed.');
    } else {
      console.log('ℹ️  Seed skipped (RUN_SEED_ON_START=false).');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to start server:', err);
    process.exit(1);
  }
};

startServer();