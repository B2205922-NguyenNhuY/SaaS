const db = require("../config/db");
const shiftService = require("../services/shift.service");
exports.startShift = async (req, res, next) => {
  try {
    const result = await shiftService.startShift(req.user);
    res
      .status(201)
      .json({ message: "Shift started", shift_id: result.insertId });
  } catch (err) {
    next(err);
  }
};
exports.endShift = async (req, res, next) => {
  try {
    const shiftId = req.params.id || req.body.shift_id;
    if (!shiftId)
      return res.status(400).json({ message: "shift_id is required" });
    await shiftService.endShift(shiftId, req.user);
    res.json({ message: "Shift ended" });
  } catch (err) {
    next(err);
  }
};
exports.getShifts = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.hoTen FROM shift s JOIN users u ON u.user_id=s.user_id AND u.tenant_id=s.tenant_id WHERE s.tenant_id = ? ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
      [req.user.tenant_id, req.pagination.limit, req.pagination.offset],
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) total FROM shift WHERE tenant_id = ?",
      [req.user.tenant_id],
    );
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.getActiveShift = async (req, res, next) => {
  try {
    const data = await shiftService.getActiveShift(req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
