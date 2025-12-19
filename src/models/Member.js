const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { MEMBER_STATUS } = require('../utils/constants');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  membership_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM(...Object.values(MEMBER_STATUS)),
    allowNull: false,
    defaultValue: MEMBER_STATUS.ACTIVE
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  join_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  max_borrow_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 10
    }
  },
  total_fines_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_fines_owed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  tableName: 'members',
  timestamps: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['membership_number'], unique: true },
    { fields: ['status'] }
  ]
});

module.exports = Member;