const S = require("../services/kioskAssignment.service");
const { logAudit } = require("../utils/audit");

exports.assign = async (req, res, next) => {
  try {
    const out = await S.assign(req.user.tenant_id, req.body);

    await logAudit(req, {
      action: "ASSIGN_KIOSK",
      entity_type: "kiosk_assignment",
      entity_id: out.assignment_id,
      newValue: req.body,
    });

    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
};

exports.mylist = async (req, res, next) => {
  try {
    const filters = {
      merchant_id: req.user.id,
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

exports.list = async (req, res, next) => {
  try {
    const filters = {
      market_id: req.query.market_id,
      zone_id: req.query.zone_id,
      kiosk_id: req.query.kiosk_id,
      merchant_id: req.query.merchant_id,
      trangThai: req.query.trangThai,
      ngayBatDau_from: req.query.ngayBatDau_from,
      ngayBatDau_to: req.query.ngayBatDau_to,
      ngayKetThuc_from: req.query.ngayKetThuc_from,
      ngayKetThuc_to: req.query.ngayKetThuc_to,
      q: req.query.q,
    };

    res.json(await S.list(req.user.tenant_id, filters, req.pagination));
  } catch (e) {
    next(e);
  }
};

exports.endAssignment = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const old = await S.getById(req.user.tenant_id, id);
    const out = await S.endAssignment(req.user.tenant_id, id);

    await logAudit(req, {
      action: "END_KIOSK_ASSIGNMENT",
      entity_type: "kiosk_assignment",
      entity_id: id,
      oldValue: old,
      newValue: out,
    });

    res.status(200).json({
      message: "Kết thúc gán kiosk thành công",
      data: out,
    });
  } catch (e) {
    next(e);
  }
};
