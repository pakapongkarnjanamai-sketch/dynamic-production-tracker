const db = require('../config/database');

/**
 * GET /api/logs
 * Query params: tray_id, process_id, action, limit (default 100)
 */
const getLogs = async (req, res) => {
  try {
    const { tray_id, process_id, action, limit = 100 } = req.query;
    const conditions = [];
    const values = [];

    if (tray_id) {
      conditions.push(`pl.tray_id = $${values.length + 1}`);
      values.push(tray_id);
    }
    if (process_id) {
      conditions.push(`pl.process_id = $${values.length + 1}`);
      values.push(process_id);
    }
    if (action) {
      conditions.push(`pl.action = $${values.length + 1}`);
      values.push(action);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    values.push(Math.min(Number(limit), 1000));

    const { rows } = await db.query(
      `SELECT pl.*,
              t.qr_code,
              t.product,
              p.name   AS process_name,
              p.sequence,
              l.name   AS line_name
         FROM production_logs pl
         JOIN trays     t ON t.id = pl.tray_id
         JOIN processes p ON p.id = pl.process_id
         JOIN lines     l ON l.id = p.line_id
       ${where}
        ORDER BY pl.logged_at DESC
        LIMIT $${values.length}`,
      values
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/logs
 *
 * Body:
 * {
 *   "tray_id":    1,
 *   "process_id": 2,
 *   "operator":   "John",
 *   "action":     "start" | "finish" | "ng",
 *   "note":       "optional note"
 * }
 *
 * Side-effect: updates trays.status based on action
 */
const createLog = async (req, res) => {
  const { tray_id, process_id, operator, action, note } = req.body;

  if (!tray_id || !process_id || !action) {
    return res.status(400).json({ error: 'tray_id, process_id, and action are required' });
  }
  if (!['start', 'finish', 'ng'].includes(action)) {
    return res.status(400).json({ error: 'action must be start, finish, or ng' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO production_logs (tray_id, process_id, operator, action, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tray_id, process_id, operator, action, note]
    );

    // Update tray status to reflect current state
    let trayStatus = action === 'ng' ? 'on_hold' : 'in_progress';

    if (action === 'finish') {
      // Check if all processes for this tray's line are now finished
      const { rows: notDone } = await db.query(
        `SELECT p.id
           FROM processes p
           JOIN trays t ON t.line_id = p.line_id AND t.id = $1
           LEFT JOIN LATERAL (
             SELECT action
               FROM production_logs
              WHERE tray_id    = $1
                AND process_id = p.id
              ORDER BY logged_at DESC
              LIMIT 1
           ) pl ON TRUE
          WHERE p.is_active = TRUE
            AND COALESCE(pl.action, '') <> 'finish'`,
        [tray_id]
      );
      if (notDone.length === 0) {
        trayStatus = 'completed';
      }
    }

    // Set started_at on the first log ever recorded for this tray
    await db.query(
      `UPDATE trays SET started_at = $1 WHERE id = $2 AND started_at IS NULL`,
      [rows[0].logged_at, tray_id]
    );

    // Set finished_at when all processes are done; clear it otherwise
    if (trayStatus === 'completed') {
      await db.query(
        `UPDATE trays SET status = $1, finished_at = $2 WHERE id = $3`,
        [trayStatus, rows[0].logged_at, tray_id]
      );
    } else {
      await db.query(
        `UPDATE trays SET status = $1, finished_at = NULL WHERE id = $2`,
        [trayStatus, tray_id]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/logs/summary  — per-tray progress summary for reporting
const getLogsSummary = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.id        AS tray_id,
              t.qr_code,
              t.product,
              t.batch_no,
              t.status,
              t.started_at,
              t.finished_at,
              l.name      AS line_name,
              COUNT(pl.id)  FILTER (WHERE pl.action = 'finish') AS finished_processes,
              COUNT(pl.id)  FILTER (WHERE pl.action = 'ng')     AS ng_count,
              MAX(pl.logged_at) AS last_activity
         FROM trays t
    LEFT JOIN lines           l  ON l.id  = t.line_id
    LEFT JOIN production_logs pl ON pl.tray_id = t.id
        GROUP BY t.id, t.qr_code, t.product, t.batch_no, t.status, t.started_at, t.finished_at, l.name
        ORDER BY last_activity DESC NULLS LAST`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getLogs, createLog, getLogsSummary };
