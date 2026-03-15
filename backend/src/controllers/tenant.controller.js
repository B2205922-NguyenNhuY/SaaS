const tenantModel = require("../models/tenant.model");
const { logAudit } = require("../utils/audit");
exports.createTenant = async (req, res) => {
  try {
    const duplicate = await tenantModel.checkDuplicate(
      req.body.email,
      req.body.soDienThoai,
    );
    if (duplicate.length > 0)
      return res
        .status(409)
        .json({ message: "Email hoặc Số điện thoại đã tồn tại" });
    const result = await tenantModel.createTenant(req.body);
    await logAudit(req, {
      action: "CREATE_TENANT",
      entity_type: "tenant",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res
      .status(201)
      .json({
        message: "Tenant created successfully",
        tenant_id: result.insertId,
      });
  } catch (error) {
    res
      .status(error.code === "ER_DUP_ENTRY" ? 409 : 500)
      .json({
        error: error.message,
        message:
          error.code === "ER_DUP_ENTRY"
            ? "Email hoặc số điện thoại đã tồn tại"
            : undefined,
      });
  }
};
exports.getAllTenants = async (req, res) => {
  try {
    res.json(await tenantModel.getAllTenants(req.pagination, req.query));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await tenantModel.getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateTenantStatus = async (req, res) => {
  try {
    const { trangThai } = req.body;
    if (!["active", "suspended"].includes(trangThai))
      return res.status(400).json({ message: "Invalid status" });
    const existing = await tenantModel.getTenantById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Tenant not found" });
    await tenantModel.updateTenantStatus(req.params.id, trangThai);
    await logAudit(req, {
      action: "UPDATE_TENANT_STATUS",
      entity_type: "tenant",
      entity_id: Number(req.params.id),
      oldValue: existing,
      newValue: { ...existing, trangThai },
    });
    res.json({ message: "Tenant status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateTenantInfo = async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await tenantModel.getTenantById(id);
    if (!existing) return res.status(404).json({ message: "Tenant not found" });
    const duplicate = await tenantModel.checkDuplicateForUpdate(
      id,
      req.body.email || existing.email,
      req.body.soDienThoai || existing.soDienThoai,
    );
    if (duplicate.length > 0)
      return res
        .status(409)
        .json({ message: "Email hoặc Số điện thoại đã tồn tại" });
    await tenantModel.updateTenantInfo(id, req.body);
    await logAudit(req, {
      action: "UPDATE_TENANT",
      entity_type: "tenant",
      entity_id: Number(id),
      oldValue: existing,
      newValue: { ...existing, ...req.body },
    });
    res.json({ message: "Tenant updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
