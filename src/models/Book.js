const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { BOOK_STATUS } = require('../utils/constants');

const Book = sequelize.define(
  'Book',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [10, 20],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    status: {
      type: DataTypes.ENUM(
        BOOK_STATUS.AVAILABLE,
        BOOK_STATUS.BORROWED,
        BOOK_STATUS.RESERVED,
        BOOK_STATUS.MAINTENANCE
      ),
      defaultValue: BOOK_STATUS.AVAILABLE,
      allowNull: false,
    },
    total_copies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, isInt: true },
    },
    available_copies: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, isInt: true },
    },
  },
  {
    tableName: 'books',
    timestamps: true,
    indexes: [
      { fields: ['isbn'], unique: true },
      { fields: ['status'] },
    ],
  }
);

Book.associate = (models) => {
  Book.hasMany(models.Transaction, {
    foreignKey: 'book_id',
    as: 'transactions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
};

module.exports = Book;
