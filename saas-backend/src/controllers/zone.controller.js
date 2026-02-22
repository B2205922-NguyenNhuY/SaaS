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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Cập nhật trạng thái Zone
    const [rs] = await conn.execute(
      `UPDATE zone SET trangThai=? WHERE tenant_id=? AND zone_id=?`,
      [locked ? "locked" : "active", tenant_id, zone_id],
    );

    if (rs.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Zone not found" });
    }

    // 2. Đồng bộ trạng thái các Kiosk bên trong
    if (locked) {
      // Nếu khóa Zone: Chuyển available -> locked
      await conn.execute(
        `UPDATE kiosk SET trangThai='locked' 
         WHERE zone_id=? AND tenant_id=? AND trangThai='available'`,
        [zone_id, tenant_id],
      );
    } else {
      // Nếu mở Zone: Chuyển các quầy đang bị locked về lại available
      await conn.execute(
        `UPDATE kiosk SET trangThai='available' 
         WHERE zone_id=? AND tenant_id=? AND trangThai='locked'`,
        [zone_id, tenant_id],
      );
    }

    await conn.commit();
    res.json({ success: true, locked: !!locked });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: "System error", error: e.message });
  } finally {
    conn.release();
  }
}

async function listZone(req, res) {
  const tenant_id = req.user.tenant_id;
  const market_id = req.query.market_id ? Number(req.query.market_id) : null;

  const [rows] = await pool.execute(
    `SELECT 
        z.zone_id, 
        z.tenKhu, 
        z.market_id, 
        z.trangThai,
        COUNT(k.kiosk_id) AS tongSoKiosk,
        SUM(CASE WHEN k.trangThai = 'available' THEN 1 ELSE 0 END) AS soQuayTrong,
        SUM(CASE WHEN k.trangThai = 'occupied' THEN 1 ELSE 0 END) AS soQuayDangThue
     FROM zone z
     LEFT JOIN kiosk k ON z.zone_id = k.zone_id
     WHERE z.tenant_id = ? AND (? IS NULL OR z.market_id = ?)
     GROUP BY z.zone_id
     ORDER BY z.zone_id DESC`,
    [tenant_id, market_id, market_id],
  );

  res.json(rows);
}

async function getZoneById(req, res) {
  const tenant_id = req.user.tenant_id;
  const zone_id = Number(req.params.id);

  const [rows] = await pool.execute(
    `SELECT z.*, m.tenCho 
     FROM zone z
     JOIN market m ON z.market_id = m.market_id
     WHERE z.tenant_id = ? AND z.zone_id = ?`,
    [tenant_id, zone_id],
  );

  if (rows.length === 0)
    return res.status(404).json({ message: "Zone not found" });
  res.json(rows[0]);
}

module.exports = { createZone, updateZone, lockZone, listZone, getZoneById };
