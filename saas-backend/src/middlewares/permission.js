// src/middlewares/permission.js
function requirePerm(perm) {
  return (req, res, next) => {
    const perms = req.user?.permissions || [];

    // nếu muốn cho super admin bypass:
    if (perms.includes("*")) return next();

    if (!perms.includes(perm)) {
      return res.status(403).json({ message: "Forbidden", required: perm });
    }
    next();
  };
}

module.exports = requirePerm;
