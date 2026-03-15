const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);

function getNodeEnv() {
  return process.env.NODE_ENV || 'development';
}

function getRequiredEnvValue(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAllowedOrigins() {
  const raw = getRequiredEnvValue('ALLOWED_ORIGINS');
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!origins.length) {
    throw new Error('ALLOWED_ORIGINS must contain at least one origin');
  }

  return origins;
}

function validateEnv() {
  const nodeEnv = getNodeEnv();
  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV value: ${nodeEnv}`);
  }

  getRequiredEnvValue('DATABASE_URL');
  getRequiredEnvValue('JWT_SECRET');
  getAllowedOrigins();
}

module.exports = {
  getAllowedOrigins,
  getNodeEnv,
  getRequiredEnvValue,
  validateEnv,
};
