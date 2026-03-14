require('dotenv').config();

const bcrypt = require('bcryptjs');

const db = require('../config/database');
const { ROLES } = require('../auth/roles');

async function main() {
  const employeeId = String(process.env.SUPERADMIN_EMPLOYEE_ID || '').trim();
  const name = String(process.env.SUPERADMIN_NAME || '').trim() || 'Developer';
  const password = String(process.env.SUPERADMIN_PASSWORD || '');

  if (!employeeId || !password) {
    throw new Error('SUPERADMIN_EMPLOYEE_ID and SUPERADMIN_PASSWORD are required');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { rows } = await db.query(
    `INSERT INTO users (employee_id, name, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (employee_id) DO UPDATE
        SET name = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            is_active = TRUE
     RETURNING id, employee_id, name, role, is_active`,
    [employeeId, name, passwordHash, ROLES.SUPERADMIN]
  );

  console.log(`SuperAdmin ready: ${rows[0].employee_id} (${rows[0].name})`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.pool.end().catch(() => {});
  });
