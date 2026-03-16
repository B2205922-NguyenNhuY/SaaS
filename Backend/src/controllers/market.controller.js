const S = require("../services/market.service");

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
      trangThai: req.query.trangThai,
      q: req.query.q,
      diaChi: req.query.diaChi,
      min_dienTich: req.query.min_dienTich,
      max_dienTich: req.query.max_dienTich,
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
