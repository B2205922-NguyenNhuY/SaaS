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

async function terminateAssignment(req, res) {
  const tenant_id = req.user.tenant_id;
  const assignment_id = Number(req.params.id); // ID của bản ghi gán kiosk

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm bản ghi assignment đang active để lấy kiosk_id
    const [aRows] = await conn.execute(
      `SELECT kiosk_id FROM kiosk_assignment 
       WHERE tenant_id=? AND assignment_id=? AND trangThai='active' FOR UPDATE`,
      [tenant_id, assignment_id],
    );

    if (aRows.length === 0) {
      await conn.rollback();
      return res
        .status(404)
        .json({ message: "Không tìm thấy lượt thuê đang hoạt động" });
    }

    const kiosk_id = aRows[0].kiosk_id;

    // 2. Cập nhật trạng thái assignment thành 'ended' và lưu ngày kết thúc thực tế
    const ngayKetThucThucTe = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await conn.execute(
      `UPDATE kiosk_assignment 
       SET trangThai='ended', ngayKetThuc=? 
       WHERE assignment_id=?`,
      [ngayKetThucThucTe, assignment_id],
    );

    // 3. Giải phóng Kiosk: Chuyển từ 'occupied' về 'available'
    await conn.execute(
      `UPDATE kiosk SET trangThai='available' 
       WHERE tenant_id=? AND kiosk_id=?`,
      [tenant_id, kiosk_id],
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Đã trả quầy và kết thúc hợp đồng thuê",
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: "Lỗi hệ thống", error: e.message });
  } finally {
    conn.release();
  }
}

async function listAssignments(req, res) {
  const tenant_id = req.user.tenant_id;
  const kiosk_id = req.query.kiosk_id ? Number(req.query.kiosk_id) : null;
  const merchant_id = req.query.merchant_id
    ? Number(req.query.merchant_id)
    : null;
  const status = req.query.trangThai || null;

  const [rows] = await pool.execute(
    `SELECT a.*, k.maKiosk, m.hoTen AS tenMerchant
     FROM kiosk_assignment a
     JOIN kiosk k ON a.kiosk_id = k.kiosk_id
     JOIN merchant m ON a.merchant_id = m.merchant_id
     WHERE a.tenant_id = ?
       AND (? IS NULL OR a.kiosk_id = ?)
       AND (? IS NULL OR a.merchant_id = ?)
       AND (? IS NULL OR a.trangThai = ?)
     ORDER BY a.assignment_id DESC`,
    [tenant_id, kiosk_id, kiosk_id, merchant_id, merchant_id, status, status],
  );
  res.json(rows);
}

module.exports = { assignKiosk, terminateAssignment, listAssignments };
