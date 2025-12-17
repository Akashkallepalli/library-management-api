const Joi = require('joi');

const bookSchema = Joi.object({
  isbn: Joi.string()
    .min(10)
    .max(20)
    .pattern(/^[0-9\-]+$/)
    .required(),
  title: Joi.string().min(1).max(255).required(),
  author: Joi.string().min(2).max(255).required(),
  category: Joi.string().min(2).max(100).required(),
  total_copies: Joi.number().integer().min(1).required(),
}).unknown(false);

const memberSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  address: Joi.string().max(500).optional(),
}).unknown(false);

const updateMemberSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  address: Joi.string().max(500).optional(),
}).unknown(false);

const borrowBookSchema = Joi.object({
  member_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  book_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
}).unknown(false);

const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }

  req.validatedData = value;
  next();
};

const validateUUIDParam = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  const schema = Joi.string().uuid({ version: 'uuidv4' });
  const { error } = schema.validate(id);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Invalid ${paramName} format`,
    });
  }
  next();
};

module.exports = {
  validateRequest,
  validateUUIDParam,
  bookSchema,
  memberSchema,
  updateMemberSchema,
  borrowBookSchema,
};
