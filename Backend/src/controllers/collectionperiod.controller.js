const db = require("../config/db");
const service = require("../services/collectionperiod.service");
const { logAudit } = require("../utils/audit");

exports.createPeriod = async (req, res, next) => {
  try {
    const result = await service.createPeriod(req.body, req.user);
    await logAudit(req, {
      action: "CREATE_COLLECTION_PERIOD",
      entity_type: "collection_period",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res.status(201).json({ message: "Collection period created", period_id: result.insertId });
  } catch (err) { next(err); }
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
    await logAudit(req, {
      action: "UPDATE_COLLECTION_PERIOD",
      entity_type: "collection_period",
      entity_id: req.params.id,
      newValue: req.body,
    });
    res.json({ message: "Collection period updated" });
  } catch (err) { next(err); }
};

exports.deletePeriod = async (req, res, next) => {
  try {
    const old = await service.getPeriodDetail(req.params.id, req.user);
    await service.deletePeriod(req.params.id, req.user);
    await logAudit(req, {
      action: "DELETE_COLLECTION_PERIOD",
      entity_type: "collection_period",
      entity_id: req.params.id,
      oldValue: old,
    });
    res.json({ message: "Collection period deleted" });
  } catch (err) { next(err); }
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
