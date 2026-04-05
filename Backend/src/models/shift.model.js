const db = require("../config/db");

// Bắt đầu ca
exports.startShift = async (data) => {
  const { tenant_id, user_id, thoiGianBatDauCa } = data;

  const [result] = await db.execute(
    `INSERT INTO shift
        (tenant_id, user_id, thoiGianBatDauCa)
         VALUES (?, ?, ?)`,
    [tenant_id, user_id, thoiGianBatDauCa],
  );

  return result;
};

// Kết thúc ca
exports.endShift = async (shift_id, tenant_id, thoiGianKetThucCa) => {
  const [result] = await db.execute(
    `UPDATE shift
        SET thoiGianKetThucCa = ?
        WHERE shift_id = ?
        AND tenant_id = ?`,
    [thoiGianKetThucCa, shift_id, tenant_id],
  );

  return result;
};

// Lấy shift đang mở
exports.getActiveShift = async (user_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT *
        FROM shift
        WHERE user_id = ?
        AND tenant_id = ?
        AND thoiGianKetThucCa IS NULL
        LIMIT 1`,
    [user_id, tenant_id],
  );

  return rows[0];
};

// Danh sách shift
exports.getShifts = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT s.*, u.hoTen
        FROM shift s
        JOIN users u
        ON s.user_id = u.user_id
        AND u.tenant_id = s.tenant_id
        WHERE s.tenant_id = ?
        ORDER BY s.created_at DESC`,
    [tenant_id],
  );

  return rows;
};

// Tổng tiền ca
exports.calculateShiftTotal = async (shift_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT 
            SUM(CASE WHEN hinhThucThanhToan = 'tien_mat' THEN soTienThu ELSE 0 END) AS tienMat,
            SUM(CASE WHEN hinhThucThanhToan = 'chuyen_khoan' THEN soTienThu ELSE 0 END) AS chuyenKhoan
        FROM receipt
        WHERE shift_id = ?
        AND tenant_id = ?`,
    [shift_id, tenant_id],
  );

  return rows[0];
};

// Cập nhật tổng tiền
exports.updateShiftTotal = async (
  shift_id,
  tenant_id,
  tienMat,
  chuyenKhoan,
) => {
  const [result] = await db.execute(
    `UPDATE shift
        SET tongTienMatThuDuoc = ?,
            tongChuyenKhoanThuDuoc = ?
        WHERE shift_id = ?
        AND tenant_id = ?`,
    [tienMat, chuyenKhoan, shift_id, tenant_id],
  );

  return result;
};

// Lấy shift theo id
exports.getShiftById = async (shift_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT *
        FROM shift
        WHERE shift_id = ?
        AND tenant_id = ?
        LIMIT 1`,
    [shift_id, tenant_id],
  );

  return rows[0];
};
