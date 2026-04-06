const db = require("../config/db");
const service = require("../services/collectionperiod.service");
exports.createPeriod = async (req, res, next) => {
  try {
    const result = await service.createPeriod(req.body, req.user);
    res
      .status(201)
      .json({
        message: "Collection period created",
        period_id: result.insertId,
      });
  } catch (err) {
    next(err);
  }
};
exports.getPeriods = async (req, res, next) => {
  try {
    const where = ["tenant_id = ?"];
    const params = [req.user.tenant_id];
    if (req.query.q) {
      where.push("tenKyThu LIKE ?");
      params.push(`%${req.query.q}%`);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM collection_period WHERE ${where.join(" AND ")}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT * FROM collection_period WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
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
exports.getPeriodDetail = async (req, res, next) => {
  try {
    res.json(await service.getPeriodDetail(req.params.id, req.user));
  } catch (err) {
    next(err);
  }
};
exports.updatePeriod = async (req, res, next) => {
  try {
    await service.updatePeriod(req.params.id, req.body, req.user);
    res.json({ message: "Collection period updated" });
  } catch (err) {
    next(err);
  }
};
exports.deletePeriod = async (req, res, next) => {
  try {
    await service.deletePeriod(req.params.id, req.user);
    res.json({ message: "Collection period deleted" });
  } catch (err) {
    next(err);
  }
};
exports.generateCharges = async (req, res, next) => {
  try {
    const period_id = Number(req.params.period_id);
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) total FROM charge WHERE tenant_id = ? AND period_id = ?",
      [req.user.tenant_id, period_id],
    );
    res.json({
      message: "Generate charges endpoint executed",
      period_id,
      existing_charge_count: total,
    });
  } catch (err) {
    next(err);
  }
};
