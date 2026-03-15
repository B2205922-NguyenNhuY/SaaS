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

exports.endAssignment = async (req, res, next) => {
  try {
    const assignment_id = Number(req.params.id);

    const oldAssignment = await S.getById(req.user.tenant_id, assignment_id);

    const out = await S.end(req.user.tenant_id, assignment_id);

    await logAudit(req, {
      action: "END_KIOSK_ASSIGNMENT",
      entity_type: "kiosk_assignment",
      entity_id: assignment_id,
      oldValue: oldAssignment,
      newValue: {
        ...oldAssignment,
        trangThai: "ended",
        ngayKetThuc: out.ngayKetThuc,
      },
    });

    return res.json({
      success: true,
      message: "Kết thúc gán kiosk thành công",
      data: out,
    });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filters = {
      kiosk_id: req.query.kiosk_id,
      merchant_id: req.query.merchant_id,
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
    const assignment_id = Number(req.params.id);
    res.json(await S.getById(req.user.tenant_id, assignment_id));
  } catch (e) {
    next(e);
  }
};
