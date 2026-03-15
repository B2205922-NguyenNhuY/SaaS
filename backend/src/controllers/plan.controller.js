const planModel = require("../models/plan.model");
const { logAudit } = require("../utils/audit");
exports.createPlan = async (req, res) => {
  try {
    const { tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho } =
      req.body;
    if (
      !tenGoi ||
      giaTien == null ||
      gioiHanSoKiosk == null ||
      gioiHanUser == null ||
      gioiHanSoCho == null
    )
      return res.status(400).json({ message: "Missing required fields" });
    const duplicate = await planModel.checkDuplicate(tenGoi);
    if (duplicate.length > 0)
      return res.status(409).json({ message: "Gói đã tồn tại" });
    const result = await planModel.createPlan(req.body);
    await logAudit(req, {
      action: "CREATE_PLAN",
      entity_type: "plan",
      entity_id: result.insertId,
      newValue: req.body,
    });
    return res
      .status(201)
      .json({ message: "Plan created successfully", plan_id: result.insertId });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      error: error.message,
      message: error.code === "ER_DUP_ENTRY" ? "Gói đã tồn tại" : undefined,
    });
  }
};
exports.getAllPlans = async (req, res) => {
  try {
    res.json(await planModel.getAllPlans(req.pagination, req.query));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getPlanById = async (req, res) => {
  try {
    const plan = await planModel.getPlanById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Gói không tồn tại" });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updatePlan = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await planModel.getPlanById(id);
    if (!existing)
      return res.status(404).json({ message: "Gói không tồn tại" });
    if (req.body.tenGoi) {
      const duplicate = await planModel.checkDuplicateForUpdate(
        id,
        req.body.tenGoi,
      );
      if (duplicate.length > 0)
        return res.status(409).json({ message: "Gói đã tồn tại" });
    }
    await planModel.updatePlan(id, req.body);
    await logAudit(req, {
      action: "UPDATE_PLAN",
      entity_type: "plan",
      entity_id: Number(id),
      oldValue: existing,
      newValue: { ...existing, ...req.body },
    });
    res.json({ message: "Plan updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;

    if (!["active", "inactive"].includes(trangThai)) {
      return res.status(400).json({
        message: "trangThai không hợp lệ",
      });
    }

    const oldPlan = await planModel.getPlanById(id);
    if (!oldPlan) {
      return res.status(404).json({
        message: "Gói không tồn tại",
      });
    }

    await planModel.updateStatus(id, trangThai);

    await logAudit(req, {
      action: "UPDATE_PLAN_STATUS",
      entity_type: "plan",
      entity_id: Number(id),
      oldValue: oldPlan,
      newValue: { ...oldPlan, trangThai },
    });

    return res.json({
      message: "Cập nhật trạng thái plan thành công",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
