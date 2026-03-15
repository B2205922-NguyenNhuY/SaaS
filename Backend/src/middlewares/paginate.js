function paginate(req, res, next) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);
  const offset = (page - 1) * limit;
  const sort = String(req.query.sort || "created_at");
  const order = String(req.query.order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  req.pagination = { page, limit, offset, sort, order };
  next();
}

module.exports = paginate;