const jwt = require('jsonwebtoken');
const { getRequiredEnvValue } = require('../config/env');

function getJwtSecret() {
  return getRequiredEnvValue('JWT_SECRET');
}

function getJwtExpiry() {
  return process.env.JWT_EXPIRES_IN || '12h';
}

function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      employee_id: user.employee_id,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiry() }
  );
}

function verifyUserToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signUserToken,
  verifyUserToken,
};
