const { ROLES } = require("../constants/role");

exports.checkTenantAccess = async (req, res, next) => {
  const { tenant_id: userTenantId, role } = req.user;

  if (role === ROLES.SUPER_ADMIN) {
    return next();
  }

  if (req.body?.tenant_id != null) {
    if (Number(req.body.tenant_id) !== Number(userTenantId)) {
      return res.status(403).json({ message: "You can only manage your own tenant" });
    }
    return next();
  }

  const isTenantIdRoute = req.baseUrl?.includes("/tenant") && req.params?.id != null;

  if (isTenantIdRoute) {
    if (Number(req.params.id) !== Number(userTenantId)) {
      return res.status(403).json({ message: "You can only manage your own tenant" });
    }
  }

  return next();
};