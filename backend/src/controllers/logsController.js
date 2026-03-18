const db = require("../config/database");
const { internalServerError } = require("../utils/httpErrors");

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

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
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
      values,
    );
    res.json(rows);
  } catch (err) {
    internalServerError(res, err, "logs.getLogs");
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
    return res
      .status(400)
      .json({ error: "tray_id, process_id, and action are required" });
  }
  if (!["start", "finish", "ng"].includes(action)) {
    return res
      .status(400)
      .json({ error: "action must be start, finish, or ng" });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO production_logs (tray_id, process_id, operator, action, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tray_id, process_id, operator, action, note],
    );

    // Update tray status to reflect current state
    let trayStatus = action === "ng" ? "ng" : "in_progress";

    if (action === "finish") {
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
        [tray_id],
      );
      if (notDone.length === 0) {
        trayStatus = "completed";
      }
    }

    // Set started_at on the first log ever recorded for this tray
    await db.query(
      `UPDATE trays SET started_at = $1 WHERE id = $2 AND started_at IS NULL`,
      [rows[0].logged_at, tray_id],
    );

    // Set finished_at when all processes are done; clear it otherwise
    if (trayStatus === "completed" || trayStatus === "ng") {
      await db.query(
        `UPDATE trays SET status = $1, finished_at = $2 WHERE id = $3`,
        [trayStatus, rows[0].logged_at, tray_id],
      );
    } else {
      await db.query(
        `UPDATE trays SET status = $1, finished_at = NULL WHERE id = $2`,
        [trayStatus, tray_id],
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    internalServerError(res, err, "logs.createLog");
  }
};

// GET /api/logs/summary  — per-tray progress summary for reporting
const getLogsSummary = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.id AS tray_id,
        t.qr_code,
        t.product,
        t.batch_no,
        t.status,
        t.due_date,
        t.started_at,
        t.finished_at,
        l.name AS line_name,
        COALESCE(proc.total_processes, 0) AS total_processes,
        COALESCE(proc.passed_processes, 0) AS passed_processes,
        COALESCE(log_counts.finished_processes, 0) AS finished_processes,
        COALESCE(log_counts.ng_count, 0) AS ng_count,
        log_counts.last_activity
      FROM trays t
    LEFT JOIN lines l ON l.id = t.line_id
    LEFT JOIN LATERAL (
     SELECT COUNT(*) AS total_processes,
         COUNT(*) FILTER (WHERE latest.action = 'finish') AS passed_processes
       FROM processes p
     LEFT JOIN LATERAL (
         SELECT pl.action
        FROM production_logs pl
          WHERE pl.tray_id = t.id
         AND pl.process_id = p.id
       ORDER BY pl.logged_at DESC
          LIMIT 1
       ) latest ON TRUE
      WHERE p.line_id = t.line_id
        AND p.is_active = TRUE
    ) proc ON TRUE
    LEFT JOIN LATERAL (
     SELECT COUNT(*) FILTER (WHERE pl.action = 'finish') AS finished_processes,
         COUNT(*) FILTER (WHERE pl.action = 'ng') AS ng_count,
         MAX(pl.logged_at) AS last_activity
       FROM production_logs pl
      WHERE pl.tray_id = t.id
    ) log_counts ON TRUE
     ORDER BY log_counts.last_activity DESC NULLS LAST`,
    );
    res.json(rows);
  } catch (err) {
    internalServerError(res, err, "logs.getLogsSummary");
  }
};

/**
 * Recalculate and persist tray status/timestamps based on current logs.
 * Called after any log is created, updated, or deleted.
 */
const recalcTrayStatus = async (trayId) => {
  // How many logs exist for this tray?
  const {
    rows: [{ cnt }],
  } = await db.query(
    `SELECT COUNT(*) AS cnt FROM production_logs WHERE tray_id = $1`,
    [trayId],
  );

  if (parseInt(cnt) === 0) {
    await db.query(
      `UPDATE trays SET status = 'pending', started_at = NULL, finished_at = NULL WHERE id = $1`,
      [trayId],
    );
    return;
  }

  const {
    rows: [{ first_at }],
  } = await db.query(
    `SELECT MIN(logged_at) AS first_at FROM production_logs WHERE tray_id = $1`,
    [trayId],
  );

  // If any process's latest action is 'ng' → terminal NG
  const { rows: ngRows } = await db.query(
    `SELECT 1
       FROM (
         SELECT DISTINCT ON (process_id) action
           FROM production_logs
          WHERE tray_id = $1
          ORDER BY process_id, logged_at DESC
       ) t
      WHERE action = 'ng'
      LIMIT 1`,
    [trayId],
  );

  if (ngRows.length > 0) {
    const {
      rows: [{ last_ng }],
    } = await db.query(
      `SELECT MAX(logged_at) AS last_ng
         FROM production_logs
        WHERE tray_id = $1
          AND action = 'ng'`,
      [trayId],
    );

    await db.query(
      `UPDATE trays SET status = 'ng', started_at = $2, finished_at = $3 WHERE id = $1`,
      [trayId, first_at, last_ng],
    );
    return;
  }

  // Count active processes for this tray's line
  const {
    rows: [{ proc_cnt }],
  } = await db.query(
    `SELECT COUNT(p.id) AS proc_cnt
       FROM processes p
       JOIN trays t ON t.line_id = p.line_id AND t.id = $1
      WHERE p.is_active = TRUE`,
    [trayId],
  );

  // Processes not yet finished (latest action != 'finish')
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
    [trayId],
  );

  const allDone = notDone.length === 0 && parseInt(proc_cnt) > 0;

  if (allDone) {
    const {
      rows: [{ last_finish }],
    } = await db.query(
      `SELECT MAX(logged_at) AS last_finish
         FROM production_logs
        WHERE tray_id = $1 AND action = 'finish'`,
      [trayId],
    );
    await db.query(
      `UPDATE trays SET status = 'completed', started_at = $2, finished_at = $3 WHERE id = $1`,
      [trayId, first_at, last_finish],
    );
  } else {
    await db.query(
      `UPDATE trays SET status = 'in_progress', started_at = $2, finished_at = NULL WHERE id = $1`,
      [trayId, first_at],
    );
  }
};

/**
 * PUT /api/logs/:id
 * Editable fields: operator, action, note
 */
const updateLog = async (req, res) => {
  const { id } = req.params;
  const { operator, action, note } = req.body;

  if (action && !["start", "finish", "ng"].includes(action)) {
    return res
      .status(400)
      .json({ error: "action must be start, finish, or ng" });
  }

  try {
    const fields = [];
    const values = [];

    if (operator !== undefined) {
      fields.push(`operator = $${values.length + 1}`);
      values.push(operator);
    }
    if (action !== undefined) {
      fields.push(`action   = $${values.length + 1}`);
      values.push(action);
    }
    if (note !== undefined) {
      fields.push(`note     = $${values.length + 1}`);
      values.push(note);
    }

    if (fields.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    values.push(id);
    const { rows } = await db.query(
      `UPDATE production_logs SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Log not found" });

    await recalcTrayStatus(rows[0].tray_id);
    res.json(rows[0]);
  } catch (err) {
    internalServerError(res, err, "logs.updateLog");
  }
};

/**
 * DELETE /api/logs/:id
 */
const deleteLog = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `DELETE FROM production_logs WHERE id = $1 RETURNING tray_id`,
      [id],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Log not found" });

    await recalcTrayStatus(rows[0].tray_id);
    res.status(204).send();
  } catch (err) {
    internalServerError(res, err, "logs.deleteLog");
  }
};

module.exports = { getLogs, createLog, getLogsSummary, updateLog, deleteLog };
