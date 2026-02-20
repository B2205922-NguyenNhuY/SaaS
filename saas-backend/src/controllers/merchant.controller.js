const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  hoTen: z.string().min(1),
  soDienThoai: z.string().optional(),
  CCCD: z.string().length(12).optional(),
  maSoThue: z.string().optional(),
  diaChiThuongTru: z.string().optional(),
  ngayThamGiaKinhDoanh: z.string().optional(), // YYYY-MM-DD
});

const updateSchema = createSchema.partial();

async function createMerchant(req, res) {
  const tenant_id = req.user.tenant_id;
  const data = createSchema.parse(req.body);

  const [rs] = await pool.execute(
    `INSERT INTO merchant (tenant_id, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenant_id,
      data.hoTen,
      data.soDienThoai ?? null,
      data.CCCD ?? null,
      data.maSoThue ?? null,
      data.diaChiThuongTru ?? null,
      data.ngayThamGiaKinhDoanh ?? null,
    ],
  );

  res.status(201).json({ merchant_id: rs.insertId });
}

async function updateMerchant(req, res) {
  const tenant_id = req.user.tenant_id;
  const merchant_id = Number(req.params.id);
  const data = updateSchema.parse(req.body);

  const fields = [];
  const values = [];
  for (const k of [
    "hoTen",
    "soDienThoai",
    "CCCD",
    "maSoThue",
    "diaChiThuongTru",
    "ngayThamGiaKinhDoanh",
  ]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (!fields.length) return res.json({ success: true });

  values.push(tenant_id, merchant_id);
  const [rs] = await pool.execute(
    `UPDATE merchant SET ${fields.join(", ")} WHERE tenant_id=? AND merchant_id=?`,
    values,
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Merchant not found" });
  res.json({ success: true });
}

async function listMerchant(req, res) {
  const tenant_id = req.user.tenant_id;
  const q = req.query.q ? `%${req.query.q}%` : null;

  const [rows] = await pool.execute(
    `SELECT merchant_id, hoTen, soDienThoai, CCCD, maSoThue, diaChiThuongTru, ngayThamGiaKinhDoanh
     FROM merchant
     WHERE tenant_id=?
       AND (
         ? IS NULL OR hoTen LIKE ? OR soDienThoai LIKE ? OR CCCD LIKE ?
       )
     ORDER BY merchant_id DESC`,
    [tenant_id, q, q, q, q],
  );
  res.json(rows);
}

module.exports = { createMerchant, updateMerchant, listMerchant };
