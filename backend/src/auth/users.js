const db = require("../config/database");

async function findUserById(id) {
  const { rows } = await db.query(
    `SELECT id,
            employee_id,
            name,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
       FROM users
      WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function findUserWithPasswordById(id) {
  const { rows } = await db.query(
    `SELECT id,
            employee_id,
            name,
            password_hash,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
       FROM users
      WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function findUserWithPasswordByEmployeeId(employeeId) {
  const { rows } = await db.query(
    `SELECT id,
            employee_id,
            name,
            password_hash,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
       FROM users
      WHERE employee_id = $1`,
    [employeeId],
  );
  return rows[0] || null;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  findUserById,
  findUserWithPasswordById,
  findUserWithPasswordByEmployeeId,
  sanitizeUser,
};
