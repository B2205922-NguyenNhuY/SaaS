const S = require("../services/merchant.service");

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

exports.list = async (req, res, next) => {
  try {
    const filters = {
      trangThai: req.query.trangThai,
      q: req.query.q,
      soDienThoai: req.query.soDienThoai,
    };
    res.json(await S.list(req.user.tenant_id, filters, req.pagination));
  } catch (e) {
    next(e);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await S.detail(req.user.tenant_id, Number(req.params.id));
    res.json(data);
  } catch (e) {
    next(e);
  }
};
