const S = require("../services/market.service");

exports.create = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const data = await S.create(tenant_id, req.body);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const id = Number(req.params.id);
    const data = await S.update(tenant_id, id, req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const id = Number(req.params.id);
    const data = await S.updateStatus(tenant_id, id, req.body); // { trangThai }
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const tenant_id = req.user.tenant_id;
    const { page, limit, offset, sort, order } = req.pagination;

    // lọc kép: tenant_id + (status/q)
    const filters = {
      trangThai: req.query.trangThai,
      q: req.query.q,
    };

    const out = await S.list(tenant_id, filters, {
      page,
      limit,
      offset,
      sort,
      order,
    });
    res.json(out);
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