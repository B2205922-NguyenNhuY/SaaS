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
      market_id: req.query.market_id,
      zone_id: req.query.zone_id,
      type_id: req.query.type_id,
      trangThai: req.query.trangThai,
      maKiosk: req.query.maKiosk,
      viTri: req.query.viTri,
      dienTich_min: req.query.dienTich_min,
      dienTich_max: req.query.dienTich_max,
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
