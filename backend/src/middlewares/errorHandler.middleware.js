function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    message: err.message || "Server error"
  });
}

module.exports = errorHandler;