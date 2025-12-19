const transactionService = require('../services/transactionService');
const { HTTP_STATUS } = require('../utils/constants');

class TransactionController {
  // Borrow book
  async borrowBook(req, res) {
    try {
      const { member_id, book_id } = req.body;

      if (!member_id || !book_id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'member_id and book_id are required',
        });
      }

      const result = await transactionService.borrowBook(member_id, book_id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.CONFLICT)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Book borrowed successfully',
        transaction: result.transaction,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Return book
  async returnBook(req, res) {
    try {
      const { id } = req.params;

      const result = await transactionService.returnBook(id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.CONFLICT)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Book returned successfully',
        transaction: result.transaction,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all transactions
  async getAllTransactions(req, res) {
    try {
      const result = await transactionService.getAllTransactions();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        transactions: result.transactions,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get overdue transactions
  async getOverdueTransactions(req, res) {
    try {
      const result = await transactionService.getOverdueTransactions();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        transactions: result.transactions,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get transaction by ID
  async getTransactionById(req, res) {
    try {
      const result = await transactionService.getTransactionById(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        transaction: result.transaction,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new TransactionController();
