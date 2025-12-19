const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { TRANSACTION_STATUS } = require('../utils/constants');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  book_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'members',
      key: 'id'
    }
  },
  borrowed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TRANSACTION_STATUS)),
    allowNull: false,
    defaultValue: TRANSACTION_STATUS.ACTIVE
  },
  overdue_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  calculated_fine: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['book_id'] },
    { fields: ['member_id'] },
    { fields: ['status'] },
    { fields: ['due_date'] },
    { fields: ['returned_at'] }
  ],
  hooks: {
    beforeCreate: async (transaction) => {
      // Set due date to 14 days from borrow date
      const dueDate = new Date(transaction.borrowed_at || new Date());
      dueDate.setDate(dueDate.getDate() + 14);
      transaction.due_date = dueDate;
    },
    beforeUpdate: async (transaction) => {
      // Calculate overdue days when book is returned
      if (transaction.changed('returned_at') && transaction.returned_at) {
        const dueDate = new Date(transaction.due_date);
        const returnedDate = new Date(transaction.returned_at);
        
        if (returnedDate > dueDate) {
          const diffTime = Math.abs(returnedDate - dueDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          transaction.overdue_days = diffDays;
          transaction.calculated_fine = diffDays * 0.5; // $0.50 per day
        }
        
        transaction.status = TRANSACTION_STATUS.RETURNED;
      }
      
      // Update status to overdue if past due date
      if (!transaction.returned_at && transaction.due_date < new Date()) {
        transaction.status = TRANSACTION_STATUS.OVERDUE;
      }
    }
  }
});

module.exports = Transaction;