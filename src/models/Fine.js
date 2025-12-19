const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fine = sequelize.define('Fine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'members',
      key: 'id'
    }
  },
  transaction_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Overdue fine'
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'fines',
  timestamps: true,
  indexes: [
    { fields: ['member_id'] },
    { fields: ['transaction_id'] },
    { fields: ['status'] },
    { fields: ['paid_at'] }
  ],
  hooks: {
    afterCreate: async (fine) => {
      // Update member's total fines owed
      const { Member } = require('./index');
      await Member.increment('total_fines_owed', {
        by: fine.amount,
        where: { id: fine.member_id }
      });
    },
    afterUpdate: async (fine) => {
      if (fine.changed('status') && fine.status === 'paid' && !fine.paid_at) {
        fine.paid_at = new Date();
        
        // Update member's fines totals
        const { Member } = require('./index');
        await Member.increment('total_fines_paid', {
          by: fine.amount,
          where: { id: fine.member_id }
        });
        
        await Member.decrement('total_fines_owed', {
          by: fine.amount,
          where: { id: fine.member_id }
        });
      }
    }
  }
});

module.exports = Fine;