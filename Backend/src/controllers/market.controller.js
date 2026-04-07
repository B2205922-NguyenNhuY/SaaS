const S = require("../services/market.service");
const auditLogModel = require("../models/auditLog.model");

exports.create = async (req, res, next) => {
  try {
    const result = await S.create(req.user.tenant_id, req.body);

    await auditLogModel.createAuditLog({
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      hanhDong: "CREATE_MARKET",
      entity_type: "market",
      entity_id: result.market_id,
      giaTriMoi: req.body,
    });

    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const result = await S.update(req.user.tenant_id, id, req.body);

    await auditLogModel.createAuditLog({
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      hanhDong: "UPDATE_MARKET",
      entity_type: "market",
      entity_id: id,
      giaTriCu: old,
      giaTriMoi: req.body,
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await S.getById(req.user.tenant_id, id);
    const result = await S.updateStatus(req.user.tenant_id, id, req.body);

    await auditLogModel.createAuditLog({
      tenant_id: req.user.tenant_id,
      user_id: req.user.id,
      hanhDong: "UPDATE_MARKET_STATUS",
      entity_type: "market",
      entity_id: id,
      giaTriCu: { trangThai: old.trangThai },
      giaTriMoi: { trangThai: req.body.trangThai },
    });

    res.json(result);
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

exports.getByTenant = async (req, res, next) => {
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