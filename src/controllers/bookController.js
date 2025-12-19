const bookService = require('../services/bookService');
const { HTTP_STATUS } = require('../utils/constants');

class BookController {
  // Create a new book
  async createBook(req, res, next) {
    try {
      const book = await bookService.createBook(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all books
  async getAllBooks(req, res, next) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await bookService.getAllBooks(filters, page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available books
  async getAvailableBooks(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await bookService.getAvailableBooks(page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get book by ID
  async getBookById(req, res, next) {
    try {
      const book = await bookService.getBookById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  // Update book
  async updateBook(req, res, next) {
    try {
      const book = await bookService.updateBook(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: book
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete book
  async deleteBook(req, res, next) {
    try {
      const result = await bookService.deleteBook(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Search books
  async searchBooks(req, res, next) {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      if (!q) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await bookService.searchBooks(q, page, limit);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // Update book status
  async updateBookStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Status is required'
        });
      }

      const book = await bookService.updateBookStatus(req.params.id, status);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: book,
        message: `Book status updated to ${status}`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookController();