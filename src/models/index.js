const Book = require('./Book');
const Member = require('./Member');
const Transaction = require('./Transaction');
const Fine = require('./Fine');

// Book - Transaction (One to Many)
Book.hasMany(Transaction, {
  foreignKey: 'book_id',
  as: 'transactions'
});
Transaction.belongsTo(Book, {
  foreignKey: 'book_id',
  as: 'book'
});

// Member - Transaction (One to Many)
Member.hasMany(Transaction, {
  foreignKey: 'member_id',
  as: 'transactions'
});
Transaction.belongsTo(Member, {
  foreignKey: 'member_id',
  as: 'member'
});

// Member - Fine (One to Many)
Member.hasMany(Fine, {
  foreignKey: 'member_id',
  as: 'fines'
});
Fine.belongsTo(Member, {
  foreignKey: 'member_id',
  as: 'member'
});

// Transaction - Fine (One to One)
Transaction.hasOne(Fine, {
  foreignKey: 'transaction_id',
  as: 'fine'
});
Fine.belongsTo(Transaction, {
  foreignKey: 'transaction_id',
  as: 'transaction'
});

module.exports = {
  Book,
  Member,
  Transaction,
  Fine,
  sequelize: require('../config/database').sequelize
};