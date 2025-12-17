const bookService = require('../services/bookService');
const { HTTP_STATUS } = require('../utils/constants');

class BookController {
  // Create book
  async createBook(req, res) {
    try {
      const result = await bookService.createBook(req.body);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.BAD_REQUEST)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Book created successfully',
        book: result.book,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get all books
  async getAllBooks(req, res) {
    try {
      const result = await bookService.getAllBooks();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        books: result.books,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get available books
  async getAvailableBooks(req, res) {
    try {
      const result = await bookService.getAvailableBooks();
      if (!result.success) {
        return res
          .status(HTTP_STATUS.INTERNAL_ERROR)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        books: result.books,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Get book by ID
  async getBookById(req, res) {
    try {
      const result = await bookService.getBookById(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        book: result.book,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Update book
  async updateBook(req, res) {
    try {
      const result = await bookService.updateBook(req.params.id, req.body);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Book updated successfully',
        book: result.book,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  // Delete book
  async deleteBook(req, res) {
    try {
      const result = await bookService.deleteBook(req.params.id);
      if (!result.success) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json({ success: false, error: result.error });
      }
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new BookController();