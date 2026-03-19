const bcrypt = require("bcryptjs");

const db = require("../config/database");
const {
  ROLES,
  canAssignRole,
  canManageRole,
  isValidRole,
} = require("../auth/roles");

const SALT_ROUNDS = 10;

function normalizeUserRow(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    name: row.name,
    role: row.role,
    is_active: row.is_active,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getUserById(id) {
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

function ensureManageable(req, targetUser) {
  if (!targetUser) {
    return { ok: false, status: 404, error: "User not found" };
  }

  if (!canManageRole(req.user.role, targetUser.role)) {
    return {
      ok: false,
      status: 403,
      error: "You are not allowed to manage this user",
    };
  }

  return { ok: true };
}

const listUsers = async (req, res) => {
  try {
    const values = [];
    let where = "";

    if (req.user.role === ROLES.ADMIN) {
      where = "WHERE role = $1";
      values.push(ROLES.VIEWER);
    }

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
        ${where}
        ORDER BY role, name ASC`,
      values,
    );
    res.json(rows.map(normalizeUserRow));
  } catch (_err) {
    res.status(500).json({ error: "Unable to fetch users" });
  }
};

const createUser = async (req, res) => {
  const employeeId = String(req.body.employee_id || "").trim();
  const name = String(req.body.name || "").trim();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "")
    .trim()
    .toLowerCase();

  if (!employeeId || !name || !password || !role) {
    return res
      .status(400)
      .json({ error: "employee_id, name, password, and role are required" });
  }
  if (!isValidRole(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  if (!canAssignRole(req.user.role, role)) {
    return res
      .status(403)
      .json({ error: "You are not allowed to assign this role" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await db.query(
      `INSERT INTO users (employee_id, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, employee_id, name, role, is_active, last_login_at, created_at, updated_at`,
      [employeeId, name, passwordHash, role],
    );
    res.status(201).json(normalizeUserRow(rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Employee ID already exists" });
    }
    return res.status(500).json({ error: "Unable to create user" });
  }
};

const updateUser = async (req, res) => {
  const targetId = Number(req.params.id);
  const employeeId =
    req.body.employee_id !== undefined
      ? String(req.body.employee_id || "").trim()
      : undefined;
  const name =
    req.body.name !== undefined
      ? String(req.body.name || "").trim()
      : undefined;
  const password =
    req.body.password !== undefined
      ? String(req.body.password || "")
      : undefined;
  const role =
    req.body.role !== undefined
      ? String(req.body.role || "")
          .trim()
          .toLowerCase()
      : undefined;
  const isActive = req.body.is_active;

  try {
    const targetUser = await getUserById(targetId);
    const permission = ensureManageable(req, targetUser);
    if (!permission.ok) {
      return res.status(permission.status).json({ error: permission.error });
    }

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (!canAssignRole(req.user.role, role)) {
        return res
          .status(403)
          .json({ error: "You are not allowed to assign this role" });
      }
    }

    const fields = [];
    const values = [];

    if (employeeId !== undefined) {
      fields.push(`employee_id = $${values.length + 1}`);
      values.push(employeeId);
    }
    if (name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    if (role !== undefined) {
      fields.push(`role = $${values.length + 1}`);
      values.push(role);
    }
    if (typeof isActive === "boolean") {
      fields.push(`is_active = $${values.length + 1}`);
      values.push(isActive);
    }
    if (password !== undefined) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password_hash = $${values.length + 1}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(targetId);
    const { rows } = await db.query(
      `UPDATE users
          SET ${fields.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, employee_id, name, role, is_active, last_login_at, created_at, updated_at`,
      values,
    );
    return res.json(normalizeUserRow(rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Employee ID already exists" });
    }
    return res.status(500).json({ error: "Unable to update user" });
  }
};

const deleteUser = async (req, res) => {
  const targetId = Number(req.params.id);

  try {
    if (req.user.id === targetId) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }

    const targetUser = await getUserById(targetId);
    const permission = ensureManageable(req, targetUser);
    if (!permission.ok) {
      return res.status(permission.status).json({ error: permission.error });
    }

    await db.query("DELETE FROM users WHERE id = $1", [targetId]);
    return res.status(204).send();
  } catch (_err) {
    return res.status(500).json({ error: "Unable to delete user" });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
