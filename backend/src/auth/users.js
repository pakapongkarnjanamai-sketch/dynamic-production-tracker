const db = require('../config/database');

async function findUserById(id) {
  const { rows } = await db.query(
    `SELECT u.id,
            u.employee_id,
            u.name,
            u.role,
            u.operator_id,
            u.is_active,
            u.last_login_at,
            u.created_at,
            u.updated_at,
            o.name AS operator_name,
            o.department AS operator_department
       FROM users u
  LEFT JOIN operators o ON o.id = u.operator_id
      WHERE u.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function findUserWithPasswordByEmployeeId(employeeId) {
  const { rows } = await db.query(
    `SELECT u.id,
            u.employee_id,
            u.name,
            u.password_hash,
            u.role,
            u.operator_id,
            u.is_active,
            u.last_login_at,
            u.created_at,
            u.updated_at,
            o.name AS operator_name,
            o.department AS operator_department
       FROM users u
  LEFT JOIN operators o ON o.id = u.operator_id
      WHERE u.employee_id = $1`,
    [employeeId]
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
  findUserWithPasswordByEmployeeId,
  sanitizeUser,
};
