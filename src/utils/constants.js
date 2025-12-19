module.exports = {
  // Book Status
  BOOK_STATUS: {
    AVAILABLE: 'available',
    BORROWED: 'borrowed',
    RESERVED: 'reserved',
    MAINTENANCE: 'maintenance',
    OVERDUE: 'overdue'
  },

  // Member Status
  MEMBER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive'
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    ACTIVE: 'active',
    RETURNED: 'returned',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled'
  },

  // Book Categories
  BOOK_CATEGORIES: [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'Arts',
    'History',
    'Biography',
    'Children',
    'Young Adult',
    'Mystery',
    'Romance',
    'Fantasy',
    'Science Fiction',
    'Self-Help',
    'Business',
    'General'
  ],

  // Business Rules
  BUSINESS_RULES: {
    MAX_BORROW_LIMIT: 3,
    LOAN_PERIOD_DAYS: 14,
    OVERDUE_FINE_RATE: 0.5, // $0.50 per day
    SUSPENSION_THRESHOLD: 3, // Overdue books for suspension
    FINE_PAYMENT_DAYS: 30 // Days to pay fine before penalty
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  }
};