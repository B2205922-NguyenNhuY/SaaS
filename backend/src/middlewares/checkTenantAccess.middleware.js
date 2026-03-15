const { ROLES, normalizeRole } = require("../constants/role");

exports.checkTenantAccess = async (req, res, next) => {
  const role = normalizeRole(req.user?.role);
  const userTenantId = Number(req.user?.tenant_id || 0) || null;
  if (role === ROLES.SUPER_ADMIN) return next();
  if (role !== ROLES.TENANT_ADMIN && role !== ROLES.COLLECTOR) {
    return res
      .status(403)
      .json({ message: "Forbidden - Cross tenant access denied" });
  }

  const targetTenantId =
    Number(
      req.body?.tenant_id ||
        req.params?.tenant_id ||
        req.query?.tenant_id ||
        userTenantId,
    ) || userTenantId;

  if (!userTenantId || userTenantId !== targetTenantId) {
    return res
      .status(403)
      .json({ message: "You can only manage your own tenant" });
  }
  return next();
};
