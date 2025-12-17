const { HTTP_STATUS } = require('../utils/constants');

class ErrorHandler extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandlerMiddleware = (err, req, res, next) => {
  const status = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    status: HTTP_STATUS.NOT_FOUND,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { ErrorHandler, errorHandlerMiddleware, notFoundHandler };
