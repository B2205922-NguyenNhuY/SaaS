const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  tenLoai: z.string().min(1),
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

module.exports = { createKioskType, listKioskType };
