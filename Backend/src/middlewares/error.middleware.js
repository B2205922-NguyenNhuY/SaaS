module.exports = (err, req, res, next) => {
  console.error('ERROR:', err.message, err.stack)
  res.status(err.statusCode || 500).json({
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  })
}