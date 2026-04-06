const S = require("../services/merchant.service");
const { logAudit } = require("../utils/audit");
const auditLogModel = require("../models/auditLog.model");

exports.create = async (req, res, next) => {
  try {
    const out = await S.create(req.user.tenant_id, req.body);

    await logAudit(req, {
      action: "CREATE_MERCHANT",
      entity_type: "merchant",
      entity_id: out.merchant_id,
      newValue: req.body,
    });

    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const old = await S.detail(req.user.tenant_id, id);
    const out = await S.update(req.user.tenant_id, id, req.body);

    await logAudit(req, {
      action: "UPDATE_MERCHANT",
      entity_type: "merchant",
      entity_id: id,
      oldValue: old,
      newValue: { ...old, ...req.body },
    });

    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const old = await S.detail(req.user.tenant_id, user.id);
    await S.update(req.user.tenant_id, user.id, req.body);
    const out = await S.detail(req.user.tenant_id, user.id);
    await auditLogModel.createAuditLog({
                          tenant_id: user.tenant_id,
                          user_id: null,
                          hanhDong: "UPDATE_PROFILE",
                          entity_type: "merchant",
                          entity_id: user.id,
                          giaTriCu: old,
                          giaTriMoi: out,
                          super_admin_id: null,
                          merchant_id: user.id,
                        });

    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filters = {
      trangThai:             req.query.trangThai,
      soDienThoai:           req.query.soDienThoai,
      CCCD:                  req.query.CCCD,
      maSoThue:              req.query.maSoThue,
      has_active_assignment: req.query.has_active_assignment,
      q:                     req.query.q,
    };
    res.json(await S.list(req.user.tenant_id, filters, req.pagination));
  } catch (e) {
    next(e);
  }
};

exports.detail = async (req, res, next) => {
  try {
    res.json(await S.detail(req.user.tenant_id, Number(req.params.id)));
  } catch (e) {
    next(e);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    res.json(await S.detail(req.user.tenant_id, Number(req.user.id)));
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id        = Number(req.params.id);
    const { trangThai } = req.body;
    const old  = await S.getById(req.user.tenant_id, id);
    const data = await S.updateStatus(req.user.tenant_id, id, trangThai);

    await logAudit(req, {
      action: "UPDATE_MERCHANT_STATUS",
      entity_type: "merchant",
      entity_id: id,
      oldValue: old,
      newValue: data,
    });

    res.json({ message: "Cập nhật trạng thái tiểu thương thành công", data });
  } catch (e) {
    next(e);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const id  = Number(req.params.id);
    const out = await S.updatePassword(req.user.tenant_id, id, req.body.newPassword);

    await logAudit(req, {
      action: "UPDATE_MERCHANT_PASSWORD",
      entity_type: "merchant",
      entity_id: id,
    });

    res.json(out);
  } catch (e) {
    next(e);
  }
};