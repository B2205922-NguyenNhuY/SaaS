const { normalizeRole } = require("../constants/role");

exports.authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user?.role) {
      return res
        .status(401)
        .json({ message: "Unauthorized - User role not found" });
    }
    const current = normalizeRole(req.user.role);
    req.user.role = current;
    if (!normalizedAllowed.includes(current)) {
      return res
        .status(403)
        .json({ message: `Forbidden - Role ${current} not allowed` });
    }
    next();
  };
};
