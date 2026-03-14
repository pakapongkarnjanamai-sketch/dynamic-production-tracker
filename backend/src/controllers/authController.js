const bcrypt = require('bcryptjs');

const db = require('../config/database');
const { signUserToken } = require('../auth/token');
const { findUserWithPasswordByEmployeeId, sanitizeUser } = require('../auth/users');

const login = async (req, res) => {
  const employeeId = String(req.body.employee_id || '').trim();
  const password = String(req.body.password || '');

  if (!employeeId || !password) {
    return res.status(400).json({ error: 'employee_id and password are required' });
  }

  try {
    const user = await findUserWithPasswordByEmployeeId(employeeId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid employee ID or password' });
    }

    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    const token = signUserToken(user);
    return res.json({ token, user: sanitizeUser({ ...user, last_login_at: new Date().toISOString() }) });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to complete login' });
  }
};

const getCurrentUser = async (req, res) => {
  return res.json(req.user);
};

module.exports = {
  login,
  getCurrentUser,
};
