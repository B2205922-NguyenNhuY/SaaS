const feeService = require("../services/feeSchedule.service");
const feeModel = require("../models/feeSchedule.model");
const { logAudit } = require("../utils/audit");
exports.createFee = async (req, res, next) => {
  try {
    const dup = await feeModel.checkDuplicate(
      req.user.tenant_id,
      req.body.tenBieuPhi,
    );
    if (dup.length)
      return res.status(409).json({ message: "Tên biểu phí đã tồn tại" });
    const result = await feeService.createFee(req.body, req.user);
    await logAudit(req, {
      action: "CREATE_FEE",
      entity_type: "fee_schedule",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res.status(201).json({ message: "Fee created", fee_id: result.insertId });
  } catch (err) {
    next(err);
  }
};
exports.getFees = async (req, res, next) => {
  try {
    const data = await feeModel.getFeesByTenant(
      req.user.tenant_id,
      req.pagination || null,
      req.query,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.getFeeDetail = async (req, res, next) => {
  try {
    const data = await feeService.getFeeDetail(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.updateFee = async (req, res, next) => {
  try {
    const old = await feeModel.getFeeById(req.params.id, req.user.tenant_id);
    if (!old) return res.status(404).json({ message: "Fee not found" });
    if (req.body.tenBieuPhi) {
      const dup = await feeModel.checkDuplicate(
        req.user.tenant_id,
        req.body.tenBieuPhi,
        req.params.id,
      );
      if (dup.length)
        return res.status(409).json({ message: "Tên biểu phí đã tồn tại" });
    }
    await feeService.updateFee(req.params.id, req.body, req.user);
    await logAudit(req, {
      action: "UPDATE_FEE",
      entity_type: "fee_schedule",
      entity_id: Number(req.params.id),
      oldValue: old,
      newValue: { ...old, ...req.body },
    });
    res.json({ message: "Fee updated successfully" });
  } catch (err) {
    next(err);
  }
};
exports.deleteFee = async (req, res, next) => {
  try {
    const old = await feeModel.getFeeById(req.params.id, req.user.tenant_id);
    if (!old) return res.status(404).json({ message: "Fee not found" });
    await feeService.deleteFee(req.params.id, req.user);
    await logAudit(req, {
      action: "DELETE_FEE",
      entity_type: "fee_schedule",
      entity_id: Number(req.params.id),
      oldValue: old,
      newValue: null,
    });
    res.json({ message: "Fee deleted" });
  } catch (err) {
    next(err);
  }
};
