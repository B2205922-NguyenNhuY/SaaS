const S = require("../services/kiosk.service");
const { logAudit } = require("../utils/audit");
exports.create = async (req, res, next) => {
  try {
    const out = await S.create(req.user.tenant_id, req.body);
    await logAudit(req, {
      action: "CREATE_KIOSK",
      entity_type: "kiosk",
      entity_id: out.kiosk_id,
      newValue: req.body,
    });
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
};
exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const out = await S.update(req.user.tenant_id, id, req.body);
    await logAudit(req, {
      action: "UPDATE_KIOSK",
      entity_type: "kiosk",
      entity_id: id,
      oldValue: old,
      newValue: { ...old, ...req.body },
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
};
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const out = await S.updateStatus(req.user.tenant_id, id, req.body);
    await logAudit(req, {
      action: "UPDATE_KIOSK_STATUS",
      entity_type: "kiosk",
      entity_id: id,
      oldValue: old,
      newValue: { ...old, ...req.body },
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
};
exports.list = async (req, res, next) => {
  try {
    const filters = {
      market_id: req.query.market_id,
      zone_id: req.query.zone_id,
      type_id: req.query.type_id,
      trangThai: req.query.trangThai,
      q: req.query.q,
    };
    res.json(await S.list(req.user.tenant_id, filters, req.pagination));
  } catch (e) {
    next(e);
  }
};
exports.getById = async (req, res, next) => {
  try {
    res.json(await S.getById(req.user.tenant_id, Number(req.params.id)));
  } catch (e) {
    next(e);
  }
};
