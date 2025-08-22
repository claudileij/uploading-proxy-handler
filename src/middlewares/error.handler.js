// Middleware to log errors
function logErrors(err, req, res, next) {
  console.error(err);
  next(err);
}

// Middleware to handle errors and send a generic response
function errorHandler(err, req, res, next) {
  res.status(500).json({
    status: 'error',
    message: err.message,
    details: err.stack,
  });
}

// Middleware to handle Boom errors (for structured HTTP-friendly errors)
function boomErrorHandler(err, req, res, next) {
  if (err.isBoom) {
    const { output } = err;
    res.status(output.statusCode).json(output.payload);
  } else {
    next(err);
  }
}

module.exports = { logErrors, errorHandler, boomErrorHandler };
