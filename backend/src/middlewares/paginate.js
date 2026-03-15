function paginate(req, res, next) {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "20", 10), 1),
    100,
  );
  const offset = (page - 1) * limit;

  // sort: field name, order: asc|desc
  const sort = (req.query.sort || "created_at").toString();
  const order =
    (req.query.order || "desc").toString().toLowerCase() === "asc"
      ? "ASC"
      : "DESC";

  req.pagination = { page, limit, offset, sort, order };
  next();
}

module.exports = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset,
  };
  next();
};
