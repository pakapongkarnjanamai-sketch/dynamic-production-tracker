const db = require("../config/database");
const { internalServerError } = require("../utils/httpErrors");

// GET /api/processes  (optionally filter by ?line_id=)
const getProcesses = async (req, res) => {
  try {
    const { line_id } = req.query;
    const { rows } = line_id
      ? await db.query(
          "SELECT * FROM processes WHERE line_id = $1 ORDER BY sequence ASC",
          [line_id],
        )
      : await db.query(
          "SELECT * FROM processes ORDER BY line_id, sequence ASC",
        );
    res.json(rows);
  } catch (err) {
    internalServerError(res, err, "processes.getProcesses");
  }
};

// GET /api/processes/:id
const getProcessById = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM processes WHERE id = $1", [
      req.params.id,
    ]);
    if (!rows.length)
      return res.status(404).json({ error: "Process not found" });
    res.json(rows[0]);
  } catch (err) {
    internalServerError(res, err, "processes.getProcessById");
  }
};

// PUT /api/processes/reorder
const reorderProcesses = async (req, res) => {
  const { line_id, process_ids } = req.body;

  if (!line_id || !Array.isArray(process_ids) || process_ids.length === 0) {
    return res
      .status(400)
      .json({ error: "line_id and process_ids are required" });
  }

  const normalizedLineId = Number(line_id);
  const orderedProcessIds = process_ids.map((id) => Number(id));

  if (
    !Number.isInteger(normalizedLineId) ||
    orderedProcessIds.some((id) => !Number.isInteger(id)) ||
    new Set(orderedProcessIds).size !== orderedProcessIds.length
  ) {
    return res.status(400).json({ error: "Invalid process reorder payload" });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: existingRows } = await client.query(
      `SELECT id, line_id
         FROM processes
        WHERE line_id = $1
        ORDER BY sequence ASC
        FOR UPDATE`,
      [normalizedLineId],
    );

    if (!existingRows.length) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "No processes found for this line" });
    }

    const existingIds = existingRows.map((row) => Number(row.id));
    const sameLength = existingIds.length === orderedProcessIds.length;
    const sameMembers = sameLength
      ? existingIds.every((id) => orderedProcessIds.includes(id))
      : false;

    if (!sameMembers) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "process_ids must include every process for the selected line",
      });
    }

    await client.query(
      "UPDATE processes SET sequence = sequence + $1 WHERE line_id = $2",
      [orderedProcessIds.length + 1000, normalizedLineId],
    );

    const caseFragments = orderedProcessIds
      .map((id, index) => `WHEN ${id} THEN ${index + 1}`)
      .join(" ");

    const { rows } = await client.query(
      `UPDATE processes
          SET sequence = CASE id ${caseFragments} END
        WHERE line_id = $1
        RETURNING *`,
      [normalizedLineId],
    );

    await client.query("COMMIT");
    rows.sort((left, right) => Number(left.sequence) - Number(right.sequence));
    res.json(rows);
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Sequence already used for this line" });
    }
    internalServerError(res, err, "processes.reorderProcesses");
  } finally {
    client.release();
  }
};

// POST /api/processes
const createProcess = async (req, res) => {
  const { line_id, name, description, sequence, is_active = true } = req.body;
  if (!line_id || !name || !sequence) {
    return res
      .status(400)
      .json({ error: "line_id, name, and sequence are required" });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO processes (line_id, name, description, sequence, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [line_id, name, description, sequence, is_active],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Sequence already used for this line" });
    }
    internalServerError(res, err, "processes.createProcess");
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
      [name, description, sequence, is_active, req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Process not found" });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Sequence already used for this line" });
    }
    internalServerError(res, err, "processes.updateProcess");
  }
};

// DELETE /api/processes/:id
const deleteProcess = async (req, res) => {
  try {
    const { rowCount } = await db.query("DELETE FROM processes WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Process not found" });
    res.status(204).send();
  } catch (err) {
    internalServerError(res, err, "processes.deleteProcess");
  }
};

module.exports = {
  getProcesses,
  getProcessById,
  reorderProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
};
