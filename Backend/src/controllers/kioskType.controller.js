const S = require("../services/kioskType.service");

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await S.create(req.body));
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const type_id = Number(req.params.id);
    res.json(await S.update(type_id, req.body));
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filters = { q: req.query.q };
    res.json(await S.list(filters, req.pagination));
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => { 
  try { 
    res.json(await S.getById(Number(req.params.id))); 
  } catch (e) { 
    next(e); 
  } 
};