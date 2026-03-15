const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authModel = require("../models/auth.model");
const {
  normalizeRole,
  PERMISSIONS_BY_ROLE,
  ROLES,
} = require("../constants/role");

exports.register = async (_req, res) =>
  res.status(404).json({ message: "Use POST /api/users instead" });

function signPayload(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "60d",
  });
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const superAdmin = await authModel.findSuperAdminByEmail(email);
    if (superAdmin) {
      if (superAdmin.trangThai !== "active")
        return res.status(403).json({ message: "Account is not active" });
      const isMatch = await bcrypt.compare(password, superAdmin.password_hash);
      if (!isMatch)
        return res.status(401).json({ message: "Password is wrong" });
      const role = ROLES.SUPER_ADMIN;
      const token = signPayload({
        id: superAdmin.admin_id,
        user_id: superAdmin.admin_id,
        role,
        tenant_id: null,
        permissions: PERMISSIONS_BY_ROLE[role],
      });
      return res.json({
        message: "Super admin login successful",
        token,
        user: {
          id: superAdmin.admin_id,
          email: superAdmin.email,
          tenant_id: null,
          role,
        },
      });
    }

    const user = await authModel.findUserByEmail(email);
    if (user) {
      if (user.trangThai !== "active")
        return res.status(403).json({ message: "Account is not active" });
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch)
        return res.status(401).json({ message: "Password is wrong" });
      const role = normalizeRole(user.tenVaiTro);
      const token = signPayload({
        id: user.user_id,
        user_id: user.user_id,
        role,
        tenant_id: user.tenant_id,
        permissions: PERMISSIONS_BY_ROLE[role],
      });
      return res.json({
        message: "User login successful",
        token,
        user: {
          id: user.user_id,
          email: user.email,
          tenant_id: user.tenant_id,
          role,
        },
      });
    }
    return res.status(401).json({ message: "Email not found" });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

exports.googleLogin = async (_req, res) => {
  return res
    .status(501)
    .json({
      message:
        "google_login endpoint is mounted but Firebase/Google verification is not configured yet",
    });
};
