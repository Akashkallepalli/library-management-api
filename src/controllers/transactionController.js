const transactionService = require('../services/transactionService');
const { HTTP_STATUS } = require('../utils/constants');

class TransactionController {
  // Borrow a book
  async borrowBook(req, res, next) {
    try {
      const { book_id, member_id, notes } = req.body;
      
      if (!book_id || !member_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Book ID and Member ID are required'
        });
      }

      const result = await transactionService.borrowBook(book_id, member_id, notes);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Return a book
  async returnBook(req, res, next) {
    try {
      const { condition, notes } = req.body;
      const result = await transactionService.returnBook(req.params.id, condition, notes);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get overdue transactions
  async getOverdueTransactions(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await transactionService.getOverdueTransactions(page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get transaction by ID
  async getTransactionById(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all transactions
  async getAllTransactions(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await transactionService.getAllTransactions(filters, page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Renew a book
  async renewBook(req, res, next) {
    try {
      const { extension_days = 7 } = req.body;
      const result = await transactionService.renewBook(req.params.id, extension_days);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get member borrowing history
  async getMemberBorrowingHistory(req, res, next) {
    try {
      const { member_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await transactionService.getMemberBorrowingHistory(member_id, page, limit);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransactionController();