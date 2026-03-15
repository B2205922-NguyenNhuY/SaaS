const feeAssignmentModel = require("../models/feeAssignment.model");
const feeAssignmentService = require("../services/feeAssignment.service");
const { logAudit } = require("../utils/audit");
exports.createAssignment = async (req, res, next) => {
  try {
    const t = req.user.tenant_id;
    const { fee_id, target_type, target_id, ngayApDung } = req.body;
    const dup = await feeAssignmentModel.checkDuplicate(
      t,
      fee_id,
      target_type,
      target_id,
      ngayApDung,
    );
    if (dup.length)
      return res.status(409).json({ message: "Fee assignment đã tồn tại" });
    const result = await feeAssignmentService.createAssignment(
      req.body,
      req.user,
    );
    await logAudit(req, {
      action: "CREATE_FEE_ASSIGNMENT",
      entity_type: "fee_assignment",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res
      .status(201)
      .json({
        message: "Fee assignment created",
        assignment_id: result.insertId,
      });
  } catch (err) {
    next(err);
  }
};
exports.listAssignments = async (req, res, next) => {
  try {
    res.json(
      await feeAssignmentModel.listByTenant(
        req.user.tenant_id,
        req.pagination,
        req.query,
      ),
    );
  } catch (err) {
    next(err);
  }
};
exports.getAssignmentById = async (req, res, next) => {
  try {
    const row = await feeAssignmentModel.getById(
      req.params.id,
      req.user.tenant_id,
    );
    if (!row) return res.status(404).json({ message: "Assignment not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
};
exports.getAssignmentsByTarget = async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;
    if (!target_type || !target_id)
      return res.status(400).json({ message: "Missing required params" });
    const data = await feeAssignmentService.getAssignmentsByTarget(
      target_type,
      parseInt(target_id),
      req.user,
    );
    res.json({ success: true, data: data || null });
  } catch (err) {
    next(err);
  }
};
exports.getAssignmentsByFee = async (req, res, next) => {
  try {
    const data = await feeAssignmentModel.getAssignmentsByFee(
      req.user.tenant_id,
      req.params.fee_id,
      req.pagination || null,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};
exports.updateAssignment = async (req, res, next) => {
  try {
    const old = await feeAssignmentModel.getById(
      req.params.id,
      req.user.tenant_id,
    );
    if (!old) return res.status(404).json({ message: "Assignment not found" });
    const body = { ...old, ...req.body };
    const dup = await feeAssignmentModel.checkDuplicate(
      req.user.tenant_id,
      body.fee_id,
      body.target_type,
      body.target_id,
      body.ngayApDung,
      req.params.id,
    );
    if (dup.length)
      return res.status(409).json({ message: "Fee assignment đã tồn tại" });
    await feeAssignmentModel.updateAssignment(
      req.params.id,
      req.user.tenant_id,
      req.body,
    );
    await logAudit(req, {
      action: "UPDATE_FEE_ASSIGNMENT",
      entity_type: "fee_assignment",
      entity_id: Number(req.params.id),
      oldValue: old,
      newValue: body,
    });
    res.json({ success: true, message: "Assignment updated" });
  } catch (err) {
    next(err);
  }
};
exports.deactivateAssignment = async (req, res, next) => {
  try {
    const old = await feeAssignmentModel.getById(
      req.params.id,
      req.user.tenant_id,
    );
    if (!old) return res.status(404).json({ message: "Assignment not found" });
    await feeAssignmentService.deactivateAssignment(req.params.id, req.user);
    await logAudit(req, {
      action: "DEACTIVATE_FEE_ASSIGNMENT",
      entity_type: "fee_assignment",
      entity_id: Number(req.params.id),
      oldValue: old,
      newValue: { ...old, trangThai: "inactive" },
    });
    res.json({ success: true, message: "Assignment deactivated" });
  } catch (err) {
    next(err);
  }
};
