const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { BOOK_STATUS, BOOK_CATEGORIES } = require('../utils/constants');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  isbn: {
    type: DataTypes.STRING(13),
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 13]
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM(...BOOK_CATEGORIES),
    allowNull: false,
    defaultValue: 'General'
  },
  status: {
    type: DataTypes.ENUM(...Object.values(BOOK_STATUS)),
    allowNull: false,
    defaultValue: BOOK_STATUS.AVAILABLE
  },
  total_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  available_copies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  published_year: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1000,
      max: new Date().getFullYear()
    }
  },
  publisher: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'books',
  timestamps: true,
  indexes: [
    { fields: ['isbn'], unique: true },
    { fields: ['title'] },
    { fields: ['author'] },
    { fields: ['category'] },
    { fields: ['status'] }
  ],
  hooks: {
    beforeValidate: (book) => {
      if (book.available_copies > book.total_copies) {
        throw new Error('Available copies cannot exceed total copies');
      }
      if (book.available_copies < 0) {
        throw new Error('Available copies cannot be negative');
      }
    },
    afterUpdate: async (book) => {
      // Auto-update status based on available copies
      if (book.available_copies === 0 && book.status !== BOOK_STATUS.BORROWED) {
        book.status = BOOK_STATUS.BORROWED;
        await book.save({ fields: ['status'] });
      } else if (book.available_copies > 0 && book.status === BOOK_STATUS.BORROWED) {
        book.status = BOOK_STATUS.AVAILABLE;
        await book.save({ fields: ['status'] });
      }
    }
  }
});

module.exports = Book;