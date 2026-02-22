const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  maKiosk: z.string().min(1),
  viTri: z.string().optional(),
  dienTich: z.number().int().nonnegative().optional(),
  type_id: z.number().int().positive(),
  zone_id: z.number().int().positive(),
});

const updateSchema = z.object({
  maKiosk: z.string().min(1).optional(),
  viTri: z.string().optional(),
  dienTich: z.number().int().nonnegative().optional(),
  type_id: z.number().int().positive().optional(),
  zone_id: z.number().int().positive().optional(),
  trangThai: z
    .enum(["available", "occupied", "maintenance", "locked"])
    .optional(),
});

async function createKiosk(req, res) {
  const tenant_id = req.user.tenant_id;
  const data = createSchema.parse(req.body);

  // Kiểm tra trùng mã Kiosk trong cùng một tenant
  const [existingKiosk] = await pool.execute(
    `SELECT kiosk_id FROM kiosk WHERE tenant_id = ? AND maKiosk = ? LIMIT 1`,
    [tenant_id, data.maKiosk],
  );

  if (existingKiosk.length > 0) {
    return res
      .status(409)
      .json({ message: "Mã Kiosk này đã tồn tại trong hệ thống." });
  }

  // check zone thuộc tenant
  const [zRows] = await pool.execute(
    `SELECT zone_id, trangThai FROM zone WHERE tenant_id=? AND zone_id=?`,
    [tenant_id, data.zone_id],
  );
  if (zRows.length === 0)
    return res.status(400).json({ message: "zone_id invalid" });
  if (zRows[0].trangThai === "locked")
    return res.status(400).json({ message: "zone locked" });

  // check type tồn tại
  const [tRows] = await pool.execute(
    `SELECT type_id FROM kiosk_type WHERE type_id=?`,
    [data.type_id],
  );
  if (tRows.length === 0)
    return res.status(400).json({ message: "type_id invalid" });

  const [rs] = await pool.execute(
    `INSERT INTO kiosk (tenant_id, zone_id, type_id, maKiosk, viTri, dienTich, trangThai)
     VALUES (?, ?, ?, ?, ?, ?, 'available')`,
    [
      tenant_id,
      data.zone_id,
      data.type_id,
      data.maKiosk,
      data.viTri ?? null,
      data.dienTich ?? null,
    ],
  );
  res.status(201).json({ kiosk_id: rs.insertId });
}

async function updateKiosk(req, res) {
  const tenant_id = req.user.tenant_id;
  const kiosk_id = Number(req.params.id);
  const data = updateSchema.parse(req.body);

  if (data.zone_id) {
    const [zRows] = await pool.execute(
      `SELECT zone_id FROM zone WHERE tenant_id=? AND zone_id=?`,
      [tenant_id, data.zone_id],
    );
    if (zRows.length === 0)
      return res.status(400).json({ message: "zone_id invalid" });
  }
  if (data.type_id) {
    const [tRows] = await pool.execute(
      `SELECT type_id FROM kiosk_type WHERE type_id=?`,
      [data.type_id],
    );
    if (tRows.length === 0)
      return res.status(400).json({ message: "type_id invalid" });
  }

  const fields = [];
  const values = [];
  for (const k of [
    "maKiosk",
    "viTri",
    "dienTich",
    "type_id",
    "zone_id",
    "trangThai",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (!fields.length) return res.json({ success: true });

  values.push(tenant_id, kiosk_id);
  const [rs] = await pool.execute(
    `UPDATE kiosk SET ${fields.join(", ")} WHERE tenant_id=? AND kiosk_id=?`,
    values,
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Kiosk not found" });
  res.json({ success: true });
}

async function lockKiosk(req, res) {
  const tenant_id = req.user.tenant_id;
  const kiosk_id = Number(req.params.id);
  const locked = req.body?.locked ?? true;

  if (locked) {
    const [rs] = await pool.execute(
      `UPDATE kiosk SET trangThai='locked' WHERE tenant_id=? AND kiosk_id=?`,
      [tenant_id, kiosk_id],
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: "Kiosk not found" });
    return res.json({ success: true, locked: true });
  }

  // unlock: nếu kiosk đang có assignment active => occupied, không thì available
  const [a] = await pool.execute(
    `SELECT 1 FROM kiosk_assignment
     WHERE tenant_id=? AND kiosk_id=? AND trangThai='active' LIMIT 1`,
    [tenant_id, kiosk_id],
  );
  const nextStatus = a.length ? "occupied" : "available";

  const [rs] = await pool.execute(
    `UPDATE kiosk SET trangThai=? WHERE tenant_id=? AND kiosk_id=?`,
    [nextStatus, tenant_id, kiosk_id],
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Kiosk not found" });
  res.json({ success: true, locked: false, trangThai: nextStatus });
}

async function listKiosk(req, res) {
  const tenant_id = req.user.tenant_id;
  const zone_id = req.query.zone_id ? Number(req.query.zone_id) : null;
  const status = req.query.trangThai || null;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const [rows] = await pool.execute(
    `SELECT kiosk_id, maKiosk, viTri, dienTich, type_id, zone_id, trangThai
     FROM kiosk
     WHERE tenant_id=?
       AND (? IS NULL OR zone_id=?)
       AND (? IS NULL OR trangThai=?)
       AND (? IS NULL OR maKiosk LIKE ?)
     ORDER BY kiosk_id DESC`,
    [tenant_id, zone_id, zone_id, status, status, q, q],
  );
  res.json(rows);
}

async function getKioskById(req, res) {
  const tenant_id = req.user.tenant_id;
  const kiosk_id = Number(req.params.id);

  const [rows] = await pool.execute(
    `SELECT k.*, z.tenKhu, kt.tenLoai 
     FROM kiosk k
     JOIN zone z ON k.zone_id = z.zone_id
     JOIN kiosk_type kt ON k.type_id = kt.type_id
     WHERE k.tenant_id = ? AND k.kiosk_id = ?`,
    [tenant_id, kiosk_id],
  );

  if (rows.length === 0)
    return res.status(404).json({ message: "Kiosk not found" });

  res.json(rows[0]);
}

// Đừng quên export thêm nó
module.exports = {
  createKiosk,
  updateKiosk,
  lockKiosk,
  listKiosk,
  getKioskById,
};
