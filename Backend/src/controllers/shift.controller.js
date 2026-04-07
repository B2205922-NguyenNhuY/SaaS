const db = require("../config/db");
const shiftService = require("../services/shift.service");

exports.startShift = async (req, res, next) => {
  try {
    const result = await shiftService.startShift(req.user, req.body);
    await logAudit(req, {
      action: "START_SHIFT",
      entity_type: "shift",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res.status(201).json({ message: "Shift started", shift_id: result.insertId });
  } catch (err) { next(err); }
};

exports.endShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id || req.body.shift_id;
    if (!shiftId) return res.status(400).json({ message: "shift_id is required" });
    await shiftService.endShift(shiftId, req.user);
    await logAudit(req, {
      action: "END_SHIFT",
      entity_type: "shift",
      entity_id: shiftId,
    });
    res.json({ message: "Shift ended" });
  } catch (err) { next(err); }
};

exports.getShifts = async (req, res, next) => {
  try {
    const where = ["s.tenant_id = ?"];
    const params = [req.user.tenant_id];
    if (req.user.role === "collector" || String(req.query.mine || "") === "1") {
      where.push("s.user_id = ?"); params.push(req.user.id);
    }
    if (req.query.from_date) { where.push("DATE(s.thoiGianBatDauCa) >= ?"); params.push(req.query.from_date); }
    if (req.query.to_date)   { where.push("DATE(s.thoiGianBatDauCa) <= ?"); params.push(req.query.to_date); }

    const [rows] = await db.query(
      `SELECT s.*, u.hoTen FROM shift s
       JOIN users u ON u.user_id = s.user_id AND u.tenant_id = s.tenant_id
       WHERE ${where.join(" AND ")} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) total FROM shift s WHERE ${where.join(" AND ")}`, params);

    res.json({ data: rows, meta: { page: req.pagination.page, limit: req.pagination.limit, total, totalPages: Math.ceil(total / req.pagination.limit) || 0 } });
  } catch (err) { next(err); }
};

exports.getActiveShift = async (req, res, next) => {
  try {
    const data = await shiftService.getActiveShift(req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.reconcileShift = async (req, res, next) => {
  try {
    const shift_id = Number(req.params.id);
    const { trangThaiDoiSoat } = req.body;
    if (!['completed', 'discrepancy'].includes(trangThaiDoiSoat))
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    const [result] = await db.execute(
      `UPDATE shift SET trangThaiDoiSoat = ?, updated_at = NOW()
       WHERE shift_id = ? AND tenant_id = ? AND thoiGianKetThucCa IS NOT NULL`,
      [trangThaiDoiSoat, shift_id, req.user.tenant_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Không tìm thấy ca hoặc ca chưa đóng' });

    await logAudit(req, {
      action: "RECONCILE_SHIFT",
      entity_type: "shift",
      entity_id: shift_id,
      newValue: { trangThaiDoiSoat },
    });

    res.json({ message: 'Đối soát thành công', trangThaiDoiSoat });
  } catch (err) { next(err); }
};