const S = require("../services/kioskType.service");
const { logAudit } = require("../utils/audit");

exports.create = async (req, res, next) => {
  try {
    const result = await S.create(req.body);
    await logAudit(req, {
      action: "CREATE_KIOSK_TYPE",
      entity_type: "kiosk_type",
      entity_id: result.type_id,
      newValue: req.body,
    });
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await S.getById(id);
    const result = await S.update(id, req.body);
    await logAudit(req, {
      action: "UPDATE_KIOSK_TYPE",
      entity_type: "kiosk_type",
      entity_id: id,
      oldValue: old,
      newValue: req.body,
    });
    res.json(result);
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    res.json(await S.list({ q: req.query.q }, req.pagination));
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    res.json(await S.getById(Number(req.params.id)));
  } catch (e) { next(e); }
};