const { Transaction, Book, Member, Fine, sequelize } = require('../models');
const { BusinessError } = require('../middleware/errorHandler');
const { 
  BOOK_STATUS, 
  TRANSACTION_STATUS, 
  HTTP_STATUS, 
  BUSINESS_RULES 
} = require('../utils/constants');
const { transactionStateMachine } = require('../utils/stateMachine');
const DateUtils = require('../utils/dateUtils');

class TransactionService {
  // Borrow a book
  async borrowBook(bookId, memberId, notes = '') {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if member can borrow
      const memberService = require('./memberService');
      await memberService.canBorrowBooks(memberId);

      // Get book with lock to prevent race conditions
      const book = await Book.findByPk(bookId, { 
        lock: transaction.LOCK.UPDATE,
        transaction 
      });

      if (!book) {
        throw new BusinessError('Book not found', HTTP_STATUS.NOT_FOUND, 'BOOK_NOT_FOUND');
      }

      // Check book availability
      if (book.status !== BOOK_STATUS.AVAILABLE || book.available_copies <= 0) {
        throw new BusinessError(
          'Book is not available for borrowing',
          HTTP_STATUS.CONFLICT,
          'BOOK_NOT_AVAILABLE'
        );
      }

      // Create transaction
      const borrowing = await Transaction.create({
        book_id: bookId,
        member_id: memberId,
        borrowed_at: DateUtils.getCurrentDate(),
        due_date: DateUtils.calculateDueDate(new Date(), BUSINESS_RULES.LOAN_PERIOD_DAYS),
        notes,
        status: TRANSACTION_STATUS.ACTIVE
      }, { transaction });

      // Update book copies
      book.available_copies -= 1;
      if (book.available_copies === 0) {
        book.status = BOOK_STATUS.BORROWED;
      }
      await book.save({ transaction });

      // Commit transaction
      await transaction.commit();

      return {
        transaction: borrowing,
        message: 'Book borrowed successfully',
        due_date: borrowing.due_date,
        return_by: DateUtils.formatDate(borrowing.due_date, 'MMMM Do YYYY')
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to borrow book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Return a book
  async returnBook(transactionId, condition = 'good', notes = '') {
    const transaction = await sequelize.transaction();
    
    try {
      // Get transaction with lock
      const borrowing = await Transaction.findByPk(transactionId, {
        include: [
          { model: Book, as: 'book' },
          { model: Member, as: 'member' }
        ],
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!borrowing) {
        throw new BusinessError('Transaction not found', HTTP_STATUS.NOT_FOUND, 'TRANSACTION_NOT_FOUND');
      }

      if (borrowing.status !== TRANSACTION_STATUS.ACTIVE && 
          borrowing.status !== TRANSACTION_STATUS.OVERDUE) {
        throw new BusinessError(
          'Book has already been returned',
          HTTP_STATUS.CONFLICT,
          'BOOK_ALREADY_RETURNED'
        );
      }

      // Calculate fine if overdue
      const returnDate = DateUtils.getCurrentDate();
      const overdueDays = DateUtils.calculateOverdueDays(borrowing.due_date, returnDate);
      const fineAmount = overdueDays > 0 ? 
        DateUtils.calculateFine(overdueDays, BUSINESS_RULES.OVERDUE_FINE_RATE) : 0;

      // Update transaction
      borrowing.returned_at = returnDate;
      borrowing.status = TRANSACTION_STATUS.RETURNED;
      borrowing.notes = notes || borrowing.notes;
      borrowing.overdue_days = overdueDays;
      borrowing.calculated_fine = fineAmount;
      await borrowing.save({ transaction });

      // Update book copies
      const book = borrowing.book;
      book.available_copies += 1;
      
      if (book.available_copies > 0 && book.status === BOOK_STATUS.BORROWED) {
        book.status = BOOK_STATUS.AVAILABLE;
      }
      await book.save({ transaction });

      // Create fine record if applicable
      let fineRecord = null;
      if (fineAmount > 0) {
        fineRecord = await Fine.create({
          member_id: borrowing.member_id,
          transaction_id: transactionId,
          amount: fineAmount,
          reason: `Overdue fine for ${overdueDays} day(s)`,
          status: 'pending',
          due_date: DateUtils.calculateDueDate(returnDate, BUSINESS_RULES.FINE_PAYMENT_DAYS)
        }, { transaction });

        // Update member's fine totals
        await borrowing.member.increment('total_fines_owed', {
          by: fineAmount,
          transaction
        });
      }

      // Check if book was damaged or lost
      if (condition === 'damaged') {
        // Apply damage fee
        const damageFee = 10; // $10 damage fee
        const damageFine = await Fine.create({
          member_id: borrowing.member_id,
          transaction_id: transactionId,
          amount: damageFee,
          reason: 'Book damage fee',
          status: 'pending',
          due_date: DateUtils.calculateDueDate(returnDate, BUSINESS_RULES.FINE_PAYMENT_DAYS)
        }, { transaction });

        await borrowing.member.increment('total_fines_owed', {
          by: damageFee,
          transaction
        });
      } else if (condition === 'lost') {
        // Mark book as lost and update inventory
        book.total_copies -= 1;
        if (book.available_copies > book.total_copies) {
          book.available_copies = book.total_copies;
        }
        await book.save({ transaction });

        const replacementFee = 50; // $50 replacement fee
        const lostFine = await Fine.create({
          member_id: borrowing.member_id,
          transaction_id: transactionId,
          amount: replacementFee,
          reason: 'Book replacement fee',
          status: 'pending',
          due_date: DateUtils.calculateDueDate(returnDate, BUSINESS_RULES.FINE_PAYMENT_DAYS)
        }, { transaction });

        await borrowing.member.increment('total_fines_owed', {
          by: replacementFee,
          transaction
        });
      }

      // Check if member needs to be suspended (has 3+ overdue books)
      await this.checkMemberSuspension(borrowing.member_id, transaction);

      await transaction.commit();

      return {
        transaction: borrowing,
        fine: fineRecord,
        message: 'Book returned successfully',
        overdue_days: overdueDays,
        fine_amount: fineAmount,
        condition: condition
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to return book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get overdue transactions
  async getOverdueTransactions(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const now = DateUtils.getCurrentDate();

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: {
          status: TRANSACTION_STATUS.OVERDUE,
          due_date: { [Op.lt]: now },
          returned_at: null
        },
        include: [
          {
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author', 'isbn']
          },
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email', 'membership_number']
          },
          {
            model: Fine,
            as: 'fine',
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['due_date', 'ASC']]
      });

      // Calculate additional details for each overdue transaction
      const overdueTransactions = transactions.map(transaction => {
        const transObj = transaction.toJSON();
        const overdueDays = DateUtils.calculateOverdueDays(transaction.due_date, now);
        
        transObj.overdue_days = overdueDays;
        transObj.calculated_fine = overdueDays * BUSINESS_RULES.OVERDUE_FINE_RATE;
        transObj.has_unpaid_fine = transObj.fine && transObj.fine.status === 'pending';
        
        return transObj;
      });

      return {
        transactions: overdueTransactions,
        total_overdue_fines: overdueTransactions.reduce((sum, trans) => 
          sum + trans.calculated_fine, 0
        ),
        total_overdue_books: count,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch overdue transactions', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get transaction by ID
  async getTransactionById(id) {
    try {
      const transaction = await Transaction.findByPk(id, {
        include: [
          {
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author', 'isbn', 'category']
          },
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email', 'membership_number']
          },
          {
            model: Fine,
            as: 'fine',
            required: false
          }
        ]
      });

      if (!transaction) {
        throw new BusinessError('Transaction not found', HTTP_STATUS.NOT_FOUND, 'TRANSACTION_NOT_FOUND');
      }

      const transObj = transaction.toJSON();
      
      // Calculate additional details
      if (transObj.status === TRANSACTION_STATUS.ACTIVE || 
          transObj.status === TRANSACTION_STATUS.OVERDUE) {
        const now = new Date();
        const dueDate = new Date(transObj.due_date);
        
        if (now > dueDate) {
          transObj.overdue_days = DateUtils.calculateOverdueDays(dueDate, now);
          transObj.calculated_fine = transObj.overdue_days * BUSINESS_RULES.OVERDUE_FINE_RATE;
        }
      }

      return transObj;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to fetch transaction', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all transactions with filtering
  async getAllTransactions(filters = {}, page = 1, limit = 20) {
    try {
      const whereClause = {};
      
      // Apply filters
      if (filters.member_id) whereClause.member_id = filters.member_id;
      if (filters.book_id) whereClause.book_id = filters.book_id;
      if (filters.status) whereClause.status = filters.status;
      
      if (filters.start_date || filters.end_date) {
        whereClause.borrowed_at = {};
        if (filters.start_date) whereClause.borrowed_at[Op.gte] = filters.start_date;
        if (filters.end_date) whereClause.borrowed_at[Op.lte] = filters.end_date;
      }

      const offset = (page - 1) * limit;
      
      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author']
          },
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'email']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['borrowed_at', 'DESC']]
      });

      return {
        transactions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch transactions', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Renew a book (extend due date)
  async renewBook(transactionId, extensionDays = 7) {
    const transaction = await sequelize.transaction();
    
    try {
      const borrowing = await Transaction.findByPk(transactionId, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!borrowing) {
        throw new BusinessError('Transaction not found', HTTP_STATUS.NOT_FOUND, 'TRANSACTION_NOT_FOUND');
      }

      if (borrowing.status !== TRANSACTION_STATUS.ACTIVE) {
        throw new BusinessError(
          'Only active transactions can be renewed',
          HTTP_STATUS.CONFLICT,
          'NOT_ACTIVE_TRANSACTION'
        );
      }

      // Check if already renewed (limit renewals)
      const renewalCount = await Transaction.count({
        where: {
          id: transactionId,
          renewed_count: { [Op.gte]: 2 } // Max 2 renewals
        }
      });

      if (renewalCount > 0) {
        throw new BusinessError(
          'Maximum renewals reached for this book',
          HTTP_STATUS.FORBIDDEN,
          'MAX_RENEWALS_REACHED'
        );
      }

      // Check if book has reservations
      const { Book } = require('../models');
      const book = await Book.findByPk(borrowing.book_id);
      if (book.status === BOOK_STATUS.RESERVED) {
        throw new BusinessError(
          'Cannot renew book that is reserved',
          HTTP_STATUS.CONFLICT,
          'BOOK_RESERVED'
        );
      }

      // Extend due date
      const newDueDate = DateUtils.calculateDueDate(borrowing.due_date, extensionDays);
      borrowing.due_date = newDueDate;
      borrowing.renewed_count = (borrowing.renewed_count || 0) + 1;
      await borrowing.save({ transaction });

      await transaction.commit();

      return {
        transaction: borrowing,
        message: 'Book renewed successfully',
        new_due_date: newDueDate,
        renewals_left: 2 - borrowing.renewed_count
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to renew book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Check and update member suspension status
  async checkMemberSuspension(memberId, dbTransaction = null) {
    try {
      const overdueCount = await Transaction.count({
        where: {
          member_id: memberId,
          status: TRANSACTION_STATUS.OVERDUE
        },
        transaction: dbTransaction
      });

      const { Member } = require('../models');
      const member = await Member.findByPk(memberId, { transaction: dbTransaction });

      if (overdueCount >= BUSINESS_RULES.SUSPENSION_THRESHOLD && 
          member.status !== 'suspended') {
        await member.update({ 
          status: 'suspended',
          suspension_reason: `Auto-suspended: ${overdueCount} overdue books`
        }, { transaction: dbTransaction });
        
        return { suspended: true, reason: `Has ${overdueCount} overdue books` };
      } else if (overdueCount < BUSINESS_RULES.SUSPENSION_THRESHOLD && 
                member.status === 'suspended' && 
                member.suspension_reason?.includes('Auto-suspended')) {
        // Auto-reactivate if overdue count drops below threshold
        await member.update({ 
          status: 'active',
          suspension_reason: null
        }, { transaction: dbTransaction });
        
        return { suspended: false, reason: 'Overdue books resolved' };
      }

      return { suspended: member.status === 'suspended' };
    } catch (error) {
      throw new BusinessError('Failed to check member suspension', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get member's borrowing history
  async getMemberBorrowingHistory(memberId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: { member_id: memberId },
        include: [
          {
            model: Book,
            as: 'book',
            attributes: ['id', 'title', 'author', 'isbn', 'category']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['borrowed_at', 'DESC']]
      });

      // Calculate statistics
      const stats = await Transaction.findAll({
        where: { member_id: memberId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_borrowed'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'overdue' THEN 1 ELSE 0 END")), 'total_overdue'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'returned' THEN 1 ELSE 0 END")), 'total_returned']
        ],
        raw: true
      });

      return {
        transactions,
        statistics: stats[0] || {
          total_borrowed: 0,
          total_overdue: 0,
          total_returned: 0
        },
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch borrowing history', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new TransactionService();