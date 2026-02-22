const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  tenLoai: z.string().min(1),
  moTa: z.string().optional(),
});

// Thêm schema cập nhật vào đầu file
const updateTypeSchema = z.object({
  tenLoai: z.string().min(1).optional(),
  moTa: z.string().optional(),
});

async function createKioskType(req, res) {
  const data = createSchema.parse(req.body);
  const [rs] = await pool.execute(
    `INSERT INTO kiosk_type (tenLoai, moTa) VALUES (?, ?)`,
    [data.tenLoai, data.moTa ?? null],
  );
  res.status(201).json({ type_id: rs.insertId });
}

async function listKioskType(req, res) {
  const [rows] = await pool.execute(
    `SELECT type_id, tenLoai, moTa FROM kiosk_type ORDER BY type_id DESC`,
  );
  res.json(rows);
}

// Cập nhật Loại Kiosk
async function updateKioskType(req, res) {
  const type_id = Number(req.params.id);
  const data = updateTypeSchema.parse(req.body);

  const fields = [];
  const values = [];

  if (data.tenLoai !== undefined) {
    fields.push("tenLoai = ?");
    values.push(data.tenLoai);
  }
  if (data.moTa !== undefined) {
    fields.push("moTa = ?");
    values.push(data.moTa);
  }

  if (fields.length === 0) return res.json({ success: true });

  values.push(type_id);
  const [rs] = await pool.execute(
    `UPDATE kiosk_type SET ${fields.join(", ")} WHERE type_id = ?`,
    values,
  );

  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Kiosk type not found" });

  res.json({ success: true });
}

// Xóa Loại Kiosk (Có kiểm tra ràng buộc)
async function deleteKioskType(req, res) {
  const type_id = Number(req.params.id);

  // Kiểm tra xem có Kiosk nào đang dùng loại này không
  const [inUse] = await pool.execute(
    `SELECT kiosk_id FROM kiosk WHERE type_id = ? LIMIT 1`,
    [type_id],
  );

  if (inUse.length > 0) {
    return res.status(400).json({
      message: "Cannot delete: This type is being used by one or more kiosks.",
    });
  }

  const [rs] = await pool.execute(`DELETE FROM kiosk_type WHERE type_id = ?`, [
    type_id,
  ]);

  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Kiosk type not found" });

  res.json({ success: true, message: "Deleted successfully" });
}

module.exports = {
  createKioskType,
  listKioskType,
  updateKioskType,
  deleteKioskType,
};
