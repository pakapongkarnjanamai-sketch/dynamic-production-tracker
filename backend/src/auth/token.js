const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'dev-change-me';

function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_SECRET;
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
