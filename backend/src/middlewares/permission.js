const { normalizeRole, PERMISSIONS_BY_ROLE } = require("../constants/role");

function requirePerm(perm) {
  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    const perms =
      Array.isArray(req.user?.permissions) && req.user.permissions.length
        ? req.user.permissions
        : PERMISSIONS_BY_ROLE[role] || [];
    if (perms.includes("*") || perms.includes(perm)) return next();
    return res.status(403).json({ message: "Forbidden", required: perm });
  };
}

module.exports = requirePerm;
