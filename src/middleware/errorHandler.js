const { HTTP_STATUS } = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
      field: err.errors[0].path
    });
  }

  // Custom business logic error
  if (err.name === 'BusinessError') {
    return res.status(err.statusCode || HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  // State machine transition error
  if (err.message.includes('Invalid transition') || err.message.includes('No transitions')) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: err.message
    });
  }

  // Joi validation error
  if (err.isJoi) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      details: err.details
    });
  }

  // Default error
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

class BusinessError extends Error {
  constructor(message, statusCode = 400, code = 'BUSINESS_ERROR') {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = { errorHandler, BusinessError };