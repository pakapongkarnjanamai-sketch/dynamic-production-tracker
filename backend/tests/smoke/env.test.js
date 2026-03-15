const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getAllowedOrigins,
  getRequiredEnvValue,
  validateEnv,
} = require('../../src/config/env');

function withEnv(vars, run) {
  const snapshot = { ...process.env };
  Object.assign(process.env, vars);
  return Promise.resolve()
    .then(run)
    .finally(() => {
      for (const key of Object.keys(process.env)) {
        if (!(key in snapshot)) {
          delete process.env[key];
        }
      }
      for (const [key, value] of Object.entries(snapshot)) {
        process.env[key] = value;
      }
    });
}

test('getRequiredEnvValue returns a non-empty env value', async () => {
  await withEnv({ EXAMPLE_KEY: 'value' }, () => {
    assert.equal(getRequiredEnvValue('EXAMPLE_KEY'), 'value');
  });
});

test('getAllowedOrigins parses comma separated origins', async () => {
  await withEnv({ ALLOWED_ORIGINS: 'https://a.example, https://b.example ' }, () => {
    const origins = getAllowedOrigins();
    assert.deepEqual(origins, ['https://a.example', 'https://b.example']);
  });
});

test('validateEnv throws when JWT_SECRET is missing', async () => {
  await withEnv(
    {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      ALLOWED_ORIGINS: 'https://app.example.com',
      JWT_SECRET: '',
    },
    () => {
      assert.throws(() => validateEnv(), /JWT_SECRET/);
    }
  );
});
