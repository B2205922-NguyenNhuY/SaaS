const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  tenKhu: z.string().min(1),
  market_id: z.number().int().positive(),
});

const updateSchema = z.object({
  tenKhu: z.string().min(1).optional(),
  market_id: z.number().int().positive().optional(),
});

async function createZone(req, res) {
  const tenant_id = req.user.tenant_id;
  const data = createSchema.parse(req.body);

  // check market thuộc tenant
  const [m] = await pool.execute(
    `SELECT market_id FROM market WHERE tenant_id=? AND market_id=?`,
    [tenant_id, data.market_id],
  );
  if (m.length === 0)
    return res.status(400).json({ message: "market_id invalid" });

  const [rs] = await pool.execute(
    `INSERT INTO zone (tenant_id, market_id, tenKhu, trangThai)
     VALUES (?, ?, ?, 'active')`,
    [tenant_id, data.market_id, data.tenKhu],
  );

  res.status(201).json({ zone_id: rs.insertId });
}

async function updateZone(req, res) {
  const tenant_id = req.user.tenant_id;
  const zone_id = Number(req.params.id);
  const data = updateSchema.parse(req.body);

  if (data.market_id) {
    const [m] = await pool.execute(
      `SELECT market_id FROM market WHERE tenant_id=? AND market_id=?`,
      [tenant_id, data.market_id],
    );
    if (m.length === 0)
      return res.status(400).json({ message: "market_id invalid" });
  }

  const fields = [];
  const values = [];
  for (const k of ["tenKhu", "market_id"]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (!fields.length) return res.json({ success: true });

  values.push(tenant_id, zone_id);

  const [rs] = await pool.execute(
    `UPDATE zone SET ${fields.join(", ")} WHERE tenant_id=? AND zone_id=?`,
    values,
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Zone not found" });
  res.json({ success: true });
}

async function lockZone(req, res) {
  const tenant_id = req.user.tenant_id;
  const zone_id = Number(req.params.id);
  const locked = req.body?.locked ?? true;

  const [rs] = await pool.execute(
    `UPDATE zone SET trangThai=? WHERE tenant_id=? AND zone_id=?`,
    [locked ? "locked" : "active", tenant_id, zone_id],
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Zone not found" });
  res.json({ success: true, locked: !!locked });
}

async function listZone(req, res) {
  const tenant_id = req.user.tenant_id;
  const market_id = req.query.market_id ? Number(req.query.market_id) : null;

  const [rows] = await pool.execute(
    `SELECT zone_id, tenKhu, market_id, trangThai
     FROM zone
     WHERE tenant_id=? AND (? IS NULL OR market_id=?)
     ORDER BY zone_id DESC`,
    [tenant_id, market_id, market_id],
  );
  res.json(rows);
}

module.exports = { createZone, updateZone, lockZone, listZone };
