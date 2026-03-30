const S = require("../services/merchant.service");
const { logAudit } = require("../utils/audit");

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
    const id = Number(req.params.id);
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
    const id = Number(req.user.id);
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

exports.list = async (req, res, next) => {
  try {
    const filters = {
      trangThai: req.query.trangThai,
      soDienThoai: req.query.soDienThoai,
      CCCD: req.query.CCCD,
      maSoThue: req.query.maSoThue,
      has_active_assignment: req.query.has_active_assignment,
      q: req.query.q,
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
    const id = Number(req.params.id);
    const old = await S.detail(req.user.tenant_id, id);
    const data = await S.updateStatus(id, req.body, req.user);

    await logAudit(req, {
      action: "UPDATE_MERCHANT_STATUS",
      entity_type: "merchant",
      entity_id: id,
      oldValue: old,
      newValue: data,
    });

    return res.status(200).json({
      message: "Cập nhật trạng thái tiểu thương thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};
