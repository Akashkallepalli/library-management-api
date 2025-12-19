const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fine = sequelize.define(
  'Fine',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    member_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'members', key: 'id' },
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'transactions', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0, isDecimal: true },
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'fines',
    timestamps: true,
    indexes: [
      { fields: ['member_id'] },
      { fields: ['transaction_id'] },
      { fields: ['paid_at'] },
    ],
  }
);

Fine.associate = (models) => {
  Fine.belongsTo(models.Member, {
    foreignKey: 'member_id',
    as: 'member',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Fine.belongsTo(models.Transaction, {
    foreignKey: 'transaction_id',
    as: 'transaction',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

module.exports = Fine;
