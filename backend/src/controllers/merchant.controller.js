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
exports.list = async (req, res, next) => {
  try {
    const filters = {
      trangThai: req.query.trangThai,
      soDienThoai: req.query.soDienThoai,
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
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { trangThai } = req.body;
    const tenant_id = req.user.tenant_id;

    if (!["active", "inactive"].includes(trangThai)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Lấy dữ liệu cũ để ghi log
    const old = await S.detail(tenant_id, id);

    // Gọi qua Service
    const result = await S.updateStatus(tenant_id, id, trangThai);

    // Ghi Audit Log
    await logAudit(req, {
      action: "UPDATE_MERCHANT_STATUS",
      entity_type: "merchant",
      entity_id: id,
      oldValue: { trangThai: old.trangThai },
      newValue: { trangThai },
    });

    res.json(result);
  } catch (e) {
    // Sử dụng next(e) để đồng bộ với các hàm khác trong controller của bạn
    next(e);
  }
};
