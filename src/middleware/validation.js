const Joi = require('joi');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  };
};

// Validation Schemas
const schemas = {
  // Book schemas
  createBook: Joi.object({
    isbn: Joi.string().min(10).max(13).required(),
    title: Joi.string().min(1).max(255).required(),
    author: Joi.string().min(1).max(255).required(),
    category: Joi.string().valid(
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'Arts', 
      'History', 'Biography', 'Children', 'Young Adult', 'Mystery',
      'Romance', 'Fantasy', 'Science Fiction', 'Self-Help', 'Business', 'General'
    ).default('General'),
    total_copies: Joi.number().integer().min(1).default(1),
    published_year: Joi.number().integer().min(1000).max(new Date().getFullYear()),
    publisher: Joi.string().max(255)
  }),

  updateBook: Joi.object({
    title: Joi.string().min(1).max(255),
    author: Joi.string().min(1).max(255),
    category: Joi.string().valid(
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'Arts', 
      'History', 'Biography', 'Children', 'Young Adult', 'Mystery',
      'Romance', 'Fantasy', 'Science Fiction', 'Self-Help', 'Business', 'General'
    ),
    total_copies: Joi.number().integer().min(1),
    available_copies: Joi.number().integer().min(0),
    status: Joi.string().valid('available', 'borrowed', 'reserved', 'maintenance')
  }),

  // Member schemas
  createMember: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    membership_number: Joi.string().required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
    address: Joi.string().max(500),
    max_borrow_limit: Joi.number().integer().min(1).max(10).default(3)
  }),

  updateMember: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
    address: Joi.string().max(500),
    status: Joi.string().valid('active', 'suspended', 'inactive'),
    max_borrow_limit: Joi.number().integer().min(1).max(10)
  }),

  // Transaction schemas
  borrowBook: Joi.object({
    book_id: Joi.string().uuid().required(),
    member_id: Joi.string().uuid().required(),
    notes: Joi.string().max(500)
  }),

  returnBook: Joi.object({
    condition: Joi.string().valid('good', 'damaged', 'lost').default('good'),
    notes: Joi.string().max(500)
  }),

  // Fine schemas
  payFine: Joi.object({
    payment_method: Joi.string().valid('cash', 'card', 'online').required(),
    amount_paid: Joi.number().positive().required(),
    transaction_reference: Joi.string().max(100)
  })
};

module.exports = { validate, schemas };