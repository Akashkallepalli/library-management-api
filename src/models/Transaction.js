const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { TRANSACTION_STATUS } = require('../utils/constants');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    book_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'books', key: 'id' },
    },
    member_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'members', key: 'id' },
    },
    borrowed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        TRANSACTION_STATUS.ACTIVE,
        TRANSACTION_STATUS.RETURNED,
        TRANSACTION_STATUS.OVERDUE
      ),
      defaultValue: TRANSACTION_STATUS.ACTIVE,
      allowNull: false,
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      { fields: ['book_id'] },
      { fields: ['member_id'] },
      { fields: ['status'] },
      { fields: ['due_date'] },
    ],
  }
);

Transaction.associate = (models) => {
  Transaction.belongsTo(models.Book, {
    foreignKey: 'book_id',
    as: 'Book',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  Transaction.belongsTo(models.Member, {
    foreignKey: 'member_id',
    as: 'Member',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  Transaction.hasOne(models.Fine, {
    foreignKey: 'transaction_id',
    as: 'fine',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Transaction;
