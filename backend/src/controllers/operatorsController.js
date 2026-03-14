const db = require('../config/database');

// GET /api/operators
const getOperators = async (req, res) => {
  try {
    const { active_only } = req.query;
    const where = active_only === 'true' ? 'WHERE is_active = TRUE' : '';
    const { rows } = await db.query(
      `SELECT * FROM operators ${where} ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/operators/:id
const getOperatorById = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM operators WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Operator not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/operators
const createOperator = async (req, res) => {
  const { name, employee_id, department } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO operators (name, employee_id, department)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, employee_id || null, department || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/operators/:id
const updateOperator = async (req, res) => {
  const { name, employee_id, department, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE operators
          SET name        = COALESCE($1, name),
              employee_id = COALESCE($2, employee_id),
              department  = COALESCE($3, department),
              is_active   = COALESCE($4, is_active)
        WHERE id = $5
        RETURNING *`,
      [name, employee_id, department, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Operator not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/operators/:id
const deleteOperator = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM operators WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Operator not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getOperators, getOperatorById, createOperator, updateOperator, deleteOperator };
