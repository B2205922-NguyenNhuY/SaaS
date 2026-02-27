// src/middlewares/auth.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // nếu hệ bạn luôn tenant-scoped:
    if (!payload.tenant_id) {
      return res.status(403).json({ message: "No tenant scope in token" });
    }

    req.user = {
      ...payload,
      user_id: payload.user_id ?? payload.sub ?? null,
      tenant_id: payload.tenant_id,
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions
        : [],
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
