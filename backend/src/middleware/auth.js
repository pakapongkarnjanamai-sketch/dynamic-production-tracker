const { verifyUserToken } = require('../auth/token');
const { findUserById, sanitizeUser } = require('../auth/users');

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyUserToken(token);
    const user = await findUserById(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = sanitizeUser(user);
    req.auth = payload;
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

function requireRoles(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    },
  ];
}

module.exports = {
  requireAuth,
  requireRoles,
};
