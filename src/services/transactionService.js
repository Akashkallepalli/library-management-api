const moment = require('moment');
const Transaction = require('../models/Transaction');
const Fine = require('../models/Fine');
const Book = require('../models/Book');
const Member = require('../models/Member');
const bookService = require('./bookService');
const memberService = require('./memberService');
const fineService = require('./fineService');
const {
  TRANSACTION_STATUS,
  BUSINESS_RULES,
  MEMBER_STATUS,
} = require('../utils/constants');
const { calculateDueDate, calculateOverdueFine, isOverdue } = require('../utils/helpers');

class TransactionService {
  // Borrow book
  async borrowBook(memberId, bookId) {
    try {
      // Check if member exists
      const memberResult = await memberService.getMemberById(memberId);
      if (!memberResult.success) {
        return { success: false, error: 'Member not found' };
      }

      const member = memberResult.member;

      // Check if member is suspended
      if (member.status === MEMBER_STATUS.SUSPENDED) {
        return {
          success: false,
          error: 'This member is suspended and cannot borrow books',
        };
      }

      // Check if member has unpaid fines
      const unpaidFinesResult = await fineService.getMemberUnpaidFines(memberId);
      if (unpaidFinesResult.success && unpaidFinesResult.fines.length > 0) {
        return {
          success: false,
          error: 'Member has unpaid fines and cannot borrow books',
        };
      }

      // Check borrow limit
      const borrowCountResult = await memberService.getCurrentBorrowCount(memberId);
      if (
        borrowCountResult.success &&
        borrowCountResult.count >= BUSINESS_RULES.MAX_BOOKS_PER_MEMBER
      ) {
        return {
          success: false,
          error: `Member has reached maximum borrow limit of ${BUSINESS_RULES.MAX_BOOKS_PER_MEMBER} books`,
        };
      }

      // Check if book exists and is available
      const bookResult = await bookService.getBookById(bookId);
      if (!bookResult.success) {
        return { success: false, error: 'Book not found' };
      }

      const book = bookResult.book;
      if (book.available_copies <= 0) {
        return { success: false, error: 'This book is not currently available' };
      }

      // Create transaction
      const borrowedAt = new Date();
      const dueDate = calculateDueDate(borrowedAt);

      const transaction = await Transaction.create({
        book_id: bookId,
        member_id: memberId,
        borrowed_at: borrowedAt,
        due_date: dueDate,
        status: TRANSACTION_STATUS.ACTIVE,
      });

      // Update book available copies
      await bookService.decreaseAvailableCopies(bookId);

      return { success: true, transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Return book
  async returnBook(transactionId) {
    try {
      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      if (transaction.status === TRANSACTION_STATUS.RETURNED) {
        return { success: false, error: 'Book already returned' };
      }

      const returnedAt = new Date();
      transaction.returned_at = returnedAt;
      transaction.status = TRANSACTION_STATUS.RETURNED;

      await transaction.save();

      // Increase available copies
      await bookService.increaseAvailableCopies(transaction.book_id);

      // Check if book is overdue and create fine if needed
      if (isOverdue(transaction.due_date)) {
        const amount = calculateOverdueFine(transaction.due_date);
        await fineService.createFine(transaction.member_id, transactionId, amount);
      }

      return { success: true, transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all transactions
  async getAllTransactions() {
    try {
      const transactions = await Transaction.findAll({
        include: [
          { model: Book, as: 'Book' },
          { model: Member, as: 'Member' },
        ],
      });
      return { success: true, transactions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get overdue transactions
  async getOverdueTransactions() {
    try {
      const transactions = await Transaction.findAll({
        where: { status: TRANSACTION_STATUS.ACTIVE },
      });

      const overdueTransactions = transactions.filter(
        (t) => isOverdue(t.due_date)
      );

      // Update status to overdue
      for (const transaction of overdueTransactions) {
        transaction.status = TRANSACTION_STATUS.OVERDUE;
        await transaction.save();
      }

      return { success: true, transactions: overdueTransactions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId) {
    try {
      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }
      return { success: true, transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TransactionService();