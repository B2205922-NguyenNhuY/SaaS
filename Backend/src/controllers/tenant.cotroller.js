const tenantService = require("../services/tenant.service");
const { logAudit } = require("../utils/audit");

exports.createTenant = async (req, res, next) => {
  try {
    const result = await tenantService.createTenant(req.body);

    const { admin, markets, ...tenantData } = req.body;

    await logAudit(req, {
      action: "CREATE_TENANT",
      entity_type: "tenant",
      entity_id: result.tenant_id,
      newValue: {
        ...tenantData,
        admin: admin
          ? { email: admin.email, hoTen: admin.hoTen, soDienThoai: admin.soDienThoai }
          : null,
        marketsRequested: (markets || []).length,
      },
    });

    res.status(201).json({
      message: "Tenant created successfully",
      tenant_id: result.tenant_id,
      marketsCreated: result.marketResults?.created ?? [],
      marketsErrors: result.marketResults?.errors ?? [],
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTenants = async (req, res, next) => {
  try {
    const rows = await tenantService.getAllTenants();
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getTenantById = async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
};

exports.listTenants = async (req, res, next) => {
  try {
    const filters = {
      keyword:      req.query.keyword,
      trangThai:    req.query.trangThai,
      created_from: req.query.created_from,
      created_to:   req.query.created_to,
      page:         Number(req.query.page)  || 1,
      limit:        Number(req.query.limit) || 10,
      sortBy:       req.query.sortBy        || "created_at",
      sortOrder:    req.query.sortOrder     || "DESC",
    };

    const result = await tenantService.listTenants(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.updateTenantStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await tenantService.getTenantById(id);

    await tenantService.updateTenantStatus(id, req.body.trangThai);

    await logAudit(req, {
      action: "UPDATE_TENANT_STATUS",
      entity_type: "tenant",
      entity_id: id,
      oldValue: old,
      newValue: { ...old, trangThai: req.body.trangThai },
    });

    res.json({ message: "Tenant status updated successfully" });
  } catch (error) {
    next(error);
  }
};

exports.updateTenantInfo = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const old = await tenantService.getTenantById(id);

    await tenantService.updateTenantInfo(id, req.body);

    await logAudit(req, {
      action: "UPDATE_TENANT",
      entity_type: "tenant",
      entity_id: id,
      oldValue: old,
      newValue: { ...old, ...req.body },
    });

    res.json({ message: "Tenant updated successfully" });
  } catch (error) {
    next(error);
  }
};