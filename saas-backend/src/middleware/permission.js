function requirePerm(perm) {
  return (req, res, next) => {
    const perms = req.user?.permissions || [];
    if (!perms.includes(perm)) {
      return res.status(403).json({ message: "Forbidden", required: perm });
    }
    next();
  };
}

module.exports = { requirePerm };
