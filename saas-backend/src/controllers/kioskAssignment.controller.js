const { pool } = require("../config/db");
const { z } = require("zod");

const assignSchema = z.object({
  kiosk_id: z.number().int().positive(),
  merchant_id: z.number().int().positive(),
  ngayBatDau: z.string().min(1), // YYYY-MM-DD
  ngayKetThuc: z.string().optional(), // YYYY-MM-DD
});

async function assignKiosk(req, res) {
  const tenant_id = req.user.tenant_id;
  const data = assignSchema.parse(req.body);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) lock kiosk row
    const [kRows] = await conn.execute(
      `SELECT kiosk_id, trangThai FROM kiosk WHERE tenant_id=? AND kiosk_id=? FOR UPDATE`,
      [tenant_id, data.kiosk_id],
    );
    if (kRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "kiosk_id invalid" });
    }
    const kioskStatus = kRows[0].trangThai;
    if (kioskStatus === "locked" || kioskStatus === "maintenance") {
      await conn.rollback();
      return res
        .status(409)
        .json({ message: "Kiosk not assignable", trangThai: kioskStatus });
    }

    // 2) check merchant
    const [mRows] = await conn.execute(
      `SELECT merchant_id FROM merchant WHERE tenant_id=? AND merchant_id=?`,
      [tenant_id, data.merchant_id],
    );
    if (mRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "merchant_id invalid" });
    }

    // 3) check đã có assignment active chưa
    const [aRows] = await conn.execute(
      `SELECT 1 FROM kiosk_assignment
       WHERE tenant_id=? AND kiosk_id=? AND trangThai='active' LIMIT 1`,
      [tenant_id, data.kiosk_id],
    );
    if (aRows.length) {
      await conn.rollback();
      return res.status(409).json({ message: "Kiosk already assigned" });
    }

    // 4) insert assignment
    const [rs] = await conn.execute(
      `INSERT INTO kiosk_assignment (tenant_id, kiosk_id, merchant_id, ngayBatDau, ngayKetThuc, trangThai)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        tenant_id,
        data.kiosk_id,
        data.merchant_id,
        data.ngayBatDau,
        data.ngayKetThuc ?? null,
      ],
    );

    // 5) update kiosk status -> occupied
    await conn.execute(
      `UPDATE kiosk SET trangThai='occupied' WHERE tenant_id=? AND kiosk_id=?`,
      [tenant_id, data.kiosk_id],
    );

    await conn.commit();
    res.status(201).json({ assignment_id: rs.insertId });
  } catch (e) {
    await conn.rollback();
    res
      .status(500)
      .json({ message: "Server error", error: String(e?.message || e) });
  } finally {
    conn.release();
  }
}

module.exports = { assignKiosk };
