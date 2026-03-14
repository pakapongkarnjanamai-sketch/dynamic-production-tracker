const db = require('../config/database');

// GET /api/trays
const getTrays = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, l.name AS line_name
         FROM trays t
    LEFT JOIN lines l ON l.id = t.line_id
        ORDER BY t.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trays/:id
const getTrayById = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, l.name AS line_name
         FROM trays t
    LEFT JOIN lines l ON l.id = t.line_id
        WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tray not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/trays/scan/:qrCode
 *
 * Core "scan QR code" endpoint.
 * Returns the tray info along with the full ordered process list for its line
 * and the set of actions already completed on this tray.
 *
 * Response shape:
 * {
 *   tray: { id, qr_code, product, batch_no, qty, status, line_id, line_name },
 *   processes: [ { id, name, sequence, last_action, last_logged_at } ],
 * }
 */
const scanTray = async (req, res) => {
  try {
    const trayResult = await db.query(
      `SELECT t.*, l.name AS line_name
         FROM trays t
    LEFT JOIN lines l ON l.id = t.line_id
        WHERE t.qr_code = $1`,
      [req.params.qrCode]
    );
    if (!trayResult.rows.length) {
      return res.status(404).json({ error: 'Tray not found for QR code: ' + req.params.qrCode });
    }
    const tray = trayResult.rows[0];

    // Fetch processes for the tray's line (active, ordered by sequence)
    const procResult = await db.query(
      `SELECT p.id, p.name, p.sequence,
              pl.action    AS last_action,
              pl.logged_at AS last_logged_at,
              pl.operator  AS last_operator,
              ps.logged_at AS start_logged_at,
              ps.operator  AS start_operator,
              pf.logged_at AS finish_logged_at,
              pf.operator  AS finish_operator
         FROM processes p
    LEFT JOIN LATERAL (
              SELECT action, logged_at, operator
                FROM production_logs
               WHERE tray_id    = $1
                 AND process_id = p.id
               ORDER BY logged_at DESC
               LIMIT 1
              ) pl ON TRUE
    LEFT JOIN LATERAL (
              SELECT logged_at, operator
                FROM production_logs
               WHERE tray_id    = $1
                 AND process_id = p.id
                 AND action     = 'start'
               ORDER BY logged_at DESC
               LIMIT 1
              ) ps ON TRUE
    LEFT JOIN LATERAL (
              SELECT logged_at, operator
                FROM production_logs
               WHERE tray_id    = $1
                 AND process_id = p.id
                 AND action     = 'finish'
               ORDER BY logged_at DESC
               LIMIT 1
              ) pf ON TRUE
        WHERE p.line_id   = $2
          AND p.is_active = TRUE
        ORDER BY p.sequence ASC`,
      [tray.id, tray.line_id]
    );

    res.json({ tray, processes: procResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/trays/stats
const getTrayStats = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*)                                                        AS total,
         COUNT(*) FILTER (WHERE status = 'pending')                     AS pending,
         COUNT(*) FILTER (WHERE status = 'in_progress')                 AS in_progress,
         COUNT(*) FILTER (WHERE status = 'completed')                   AS completed,
         COUNT(*) FILTER (WHERE status = 'on_hold')                     AS on_hold,
         COUNT(*) FILTER (
           WHERE due_date IS NOT NULL
             AND due_date < NOW()
             AND status <> 'completed'
         )                                                              AS delayed
         FROM trays`
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/trays
const createTray = async (req, res) => {
  const { qr_code, line_id, product, batch_no, qty = 1, due_date } = req.body;
  if (!qr_code) return res.status(400).json({ error: 'qr_code is required' });
  try {
    const { rows } = await db.query(
      `INSERT INTO trays (qr_code, line_id, product, batch_no, qty, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [qr_code, line_id, product, batch_no, qty, due_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'QR code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/trays/:id
const updateTray = async (req, res) => {
  const { line_id, product, batch_no, qty, status, due_date } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE trays
          SET line_id  = COALESCE($1, line_id),
              product  = COALESCE($2, product),
              batch_no = COALESCE($3, batch_no),
              qty      = COALESCE($4, qty),
              status   = COALESCE($5, status),
              due_date = CASE WHEN $6::boolean THEN $7::timestamptz ELSE due_date END
        WHERE id = $8
        RETURNING *`,
      [line_id, product, batch_no, qty, status,
       due_date !== undefined,
       due_date || null,
       req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tray not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/trays/:id
const deleteTray = async (req, res) => {
  try {
    const { rowCount } = await db.query(
      'DELETE FROM trays WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Tray not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getTrays, getTrayById, scanTray, getTrayStats, createTray, updateTray, deleteTray };
