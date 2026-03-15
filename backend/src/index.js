require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const { getAllowedOrigins, validateEnv } = require('./config/env');
const db = require('./config/database');

const authRouter       = require('./routes/auth');
const linesRouter      = require('./routes/lines');
const processesRouter  = require('./routes/processes');
const traysRouter      = require('./routes/trays');
const logsRouter       = require('./routes/logs');
const operatorsRouter  = require('./routes/operators');
const usersRouter      = require('./routes/users');

validateEnv();

const app  = express();
const PORT = process.env.PORT || 4000;

function logEvent(level, message, details = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...details,
  };
  const serialized = JSON.stringify(payload);
  if (level === 'error' || level === 'warn') {
    console.error(serialized);
    return;
  }
  console.log(serialized);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json());
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = String(requestId);
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready', ts: new Date().toISOString(), request_id: req.requestId });
  } catch (err) {
    logEvent('error', 'Readiness check failed', {
      request_id: req.requestId,
      error: err.message,
    });
    res.status(503).json({ error: 'Service unavailable', request_id: req.requestId });
  }
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/auth',       authRouter);
app.use('/api/lines',      linesRouter);
app.use('/api/processes',  processesRouter);
app.use('/api/trays',      traysRouter);
app.use('/api/logs',       logsRouter);
app.use('/api/operators',  operatorsRouter);
app.use('/api/users',      usersRouter);

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  logEvent('error', 'Unhandled request error', {
    request_id: req.requestId,
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error', request_id: req.requestId });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  logEvent('info', `VS MES API running on http://localhost:${PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logEvent('info', `Received ${signal}, starting graceful shutdown`);

  server.close(async (serverErr) => {
    if (serverErr) {
      logEvent('error', 'Failed to close HTTP server cleanly', { error: serverErr.message });
    }

    try {
      await db.pool.end();
      logEvent('info', 'PostgreSQL pool closed');
      process.exit(serverErr ? 1 : 0);
    } catch (poolErr) {
      logEvent('error', 'Failed to close PostgreSQL pool', { error: poolErr.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logEvent('warn', 'Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

module.exports = app;
