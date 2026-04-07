const S = require("../services/zone.service");
const { logAudit } = require("../utils/audit");

exports.create = async (req, res, next) => {
  try {
    const result = await S.create(req.user.tenant_id, req.body);
    await logAudit(req, {
      action: "CREATE_ZONE",
      entity_type: "zone",
      entity_id: result.zone_id,
      newValue: req.body,
    });
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const result = await S.update(req.user.tenant_id, id, req.body);
    await logAudit(req, {
      action: "UPDATE_ZONE",
      entity_type: "zone",
      entity_id: id,
      oldValue: old,
      newValue: req.body,
    });
    res.json(result);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const result = await S.updateStatus(req.user.tenant_id, id, req.body);
    await logAudit(req, {
      action: "UPDATE_ZONE_STATUS",
      entity_type: "zone",
      entity_id: id,
      oldValue: { trangThai: old.trangThai },
      newValue: { trangThai: req.body.trangThai },
    });
    res.json(result);
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const filters = {
      market_id: req.query.market_id,
      trangThai: req.query.trangThai,
      q: req.query.q,
      tenCho: req.query.tenCho,
      market_trangThai: req.query.market_trangThai,
    };
    res.json(await S.list(req.user.tenant_id, filters, req.pagination));
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    res.json(await S.getById(req.user.tenant_id, Number(req.params.id)));
  } catch (e) { next(e); }
};