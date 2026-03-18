const bcrypt = require("bcryptjs");

const db = require("../config/database");
const { signUserToken } = require("../auth/token");
const {
  findUserById,
  findUserWithPasswordByEmployeeId,
  findUserWithPasswordById,
  sanitizeUser,
} = require("../auth/users");

const SALT_ROUNDS = 10;

const login = async (req, res) => {
  const employeeId = String(req.body.employee_id || "").trim();
  const password = String(req.body.password || "");

  if (!employeeId || !password) {
    return res
      .status(400)
      .json({ error: "employee_id and password are required" });
  }

  try {
    const user = await findUserWithPasswordByEmployeeId(employeeId);

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid employee ID or password" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid employee ID or password" });
    }

    await db.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = signUserToken(user);
    return res.json({
      token,
      user: sanitizeUser({ ...user, last_login_at: new Date().toISOString() }),
    });
  } catch (err) {
    return res.status(500).json({ error: "Unable to complete login" });
  }
};

const getCurrentUser = async (req, res) => {
  return res.json(req.user);
};

const updateCurrentUser = async (req, res) => {
  const name =
    req.body.name !== undefined
      ? String(req.body.name || "").trim()
      : undefined;
  const currentPassword =
    req.body.current_password !== undefined
      ? String(req.body.current_password || "")
      : undefined;
  const newPassword =
    req.body.new_password !== undefined
      ? String(req.body.new_password || "")
      : undefined;

  if (name !== undefined && !name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (newPassword !== undefined) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    if (newPassword === currentPassword) {
      return res
        .status(400)
        .json({
          error: "New password must be different from current password",
        });
    }
  }

  if (name === undefined && newPassword === undefined) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const fields = [];
    const values = [];

    if (name !== undefined && name !== req.user.name) {
      fields.push(`name = $${values.length + 1}`);
      values.push(name);
    }

    if (newPassword !== undefined) {
      const userWithPassword = await findUserWithPasswordById(req.user.id);
      if (!userWithPassword) {
        return res.status(404).json({ error: "User not found" });
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password_hash,
      );
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      fields.push(`password_hash = $${values.length + 1}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      const currentUser = await findUserById(req.user.id);
      return res.json(sanitizeUser(currentUser));
    }

    values.push(req.user.id);
    await db.query(
      `UPDATE users
          SET ${fields.join(", ")}
        WHERE id = $${values.length}`,
      values,
    );

    const updatedUser = await findUserById(req.user.id);
    return res.json(sanitizeUser(updatedUser));
  } catch (_err) {
    return res.status(500).json({ error: "Unable to update profile" });
  }
};

module.exports = {
  login,
  getCurrentUser,
  updateCurrentUser,
};
