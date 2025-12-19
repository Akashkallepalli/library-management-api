const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { MEMBER_STATUS } = require('../utils/constants');

const Member = sequelize.define(
  'Member',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true, len: [2, 100] },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    membership_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [10, 15] },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(MEMBER_STATUS.ACTIVE, MEMBER_STATUS.SUSPENDED),
      defaultValue: MEMBER_STATUS.ACTIVE,
      allowNull: false,
    },
  },
  {
    tableName: 'members',
    timestamps: true,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['membership_number'], unique: true },
      { fields: ['status'] },
    ],
  }
);

Member.associate = (models) => {
  Member.hasMany(models.Transaction, {
    foreignKey: 'member_id',
    as: 'transactions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });

  Member.hasMany(models.Fine, {
    foreignKey: 'member_id',
    as: 'fines',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Member;
