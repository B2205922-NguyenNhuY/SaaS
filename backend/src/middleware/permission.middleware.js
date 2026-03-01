exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role !== permission) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  }
}