const S = require("../services/kiosk.service");

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await S.create(req.user.tenant_id, req.body));
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    res.json(
      await S.update(req.user.tenant_id, Number(req.params.id), req.body),
    );
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    res.json(
      await S.updateStatus(req.user.tenant_id, Number(req.params.id), req.body),
    );
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filters = {
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
    const tenant_id = req.user.tenant_id;
    const kiosk_id = Number(req.params.id);
    const row = await S.getById(tenant_id, kiosk_id);
    res.json(row);
  } catch (e) {
    next(e);
  }
};