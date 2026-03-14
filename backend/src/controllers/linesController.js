const db = require('../config/database');

// GET /api/lines
const getLines = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM lines ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/lines/:id
const getLineById = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM lines WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Line not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/lines
const createLine = async (req, res) => {
  const { name, description, is_active = true } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const { rows } = await db.query(
      'INSERT INTO lines (name, description, is_active) VALUES ($1, $2, $3) RETURNING *',
      [name, description, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/lines/:id
const updateLine = async (req, res) => {
  const { name, description, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE lines
          SET name        = COALESCE($1, name),
              description = COALESCE($2, description),
              is_active   = COALESCE($3, is_active)
        WHERE id = $4
        RETURNING *`,
      [name, description, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Line not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/lines/:id
const deleteLine = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM lines WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Line not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/lines/:id/processes  (convenience: line + its ordered processes)
const getLineWithProcesses = async (req, res) => {
  try {
    const lineResult = await db.query(
      'SELECT * FROM lines WHERE id = $1',
      [req.params.id]
    );
    if (!lineResult.rows.length) return res.status(404).json({ error: 'Line not found' });

    const procResult = await db.query(
      'SELECT * FROM processes WHERE line_id = $1 AND is_active = TRUE ORDER BY sequence ASC',
      [req.params.id]
    );
    res.json({ ...lineResult.rows[0], processes: procResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLines, getLineById, createLine, updateLine, deleteLine, getLineWithProcesses };
