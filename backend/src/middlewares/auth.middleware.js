const jwt = require("jsonwebtoken");
const { normalizeRole, PERMISSIONS_BY_ROLE } = require("../constants/role");

exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing" });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = normalizeRole(decoded.role);
    req.user = {
      ...decoded,
      id: decoded.id ?? decoded.user_id ?? decoded.sub ?? null,
      user_id: decoded.user_id ?? decoded.id ?? decoded.sub ?? null,
      role,
      tenant_id: decoded.tenant_id ?? null,
      permissions:
        Array.isArray(decoded.permissions) && decoded.permissions.length
          ? decoded.permissions
          : PERMISSIONS_BY_ROLE[role] || [],
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
