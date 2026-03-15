const db = require('../config/database');
const { internalServerError } = require('../utils/httpErrors');

// GET /api/processes  (optionally filter by ?line_id=)
const getProcesses = async (req, res) => {
  try {
    const { line_id } = req.query;
    const { rows } = line_id
      ? await db.query(
          'SELECT * FROM processes WHERE line_id = $1 ORDER BY sequence ASC',
          [line_id]
        )
      : await db.query('SELECT * FROM processes ORDER BY line_id, sequence ASC');
    res.json(rows);
  } catch (err) {
    internalServerError(res, err, 'processes.getProcesses');
  }
};

// GET /api/processes/:id
const getProcessById = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM processes WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Process not found' });
    res.json(rows[0]);
  } catch (err) {
    internalServerError(res, err, 'processes.getProcessById');
  }
};

// POST /api/processes
const createProcess = async (req, res) => {
  const { line_id, name, description, sequence, is_active = true } = req.body;
  if (!line_id || !name || !sequence) {
    return res.status(400).json({ error: 'line_id, name, and sequence are required' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO processes (line_id, name, description, sequence, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [line_id, name, description, sequence, is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Sequence already used for this line' });
    }
    internalServerError(res, err, 'processes.createProcess');
  }
};

// PUT /api/processes/:id
const updateProcess = async (req, res) => {
  const { name, description, sequence, is_active } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE processes
          SET name        = COALESCE($1, name),
              description = COALESCE($2, description),
              sequence    = COALESCE($3, sequence),
              is_active   = COALESCE($4, is_active)
        WHERE id = $5
        RETURNING *`,
      [name, description, sequence, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Process not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Sequence already used for this line' });
    }
    internalServerError(res, err, 'processes.updateProcess');
  }
};

// DELETE /api/processes/:id
const deleteProcess = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM processes WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Process not found' });
    res.status(204).send();
  } catch (err) {
    internalServerError(res, err, 'processes.deleteProcess');
  }
};

module.exports = { getProcesses, getProcessById, createProcess, updateProcess, deleteProcess };
