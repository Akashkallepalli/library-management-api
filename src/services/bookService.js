const { Book } = require('../models');
const { BusinessError } = require('../middleware/errorHandler');
const { BOOK_STATUS, HTTP_STATUS } = require('../utils/constants');
const { bookStateMachine } = require('../utils/stateMachine');

class BookService {
  // Create a new book
  async createBook(bookData) {
    try {
      // Check if ISBN already exists
      const existingBook = await Book.findOne({ where: { isbn: bookData.isbn } });
      if (existingBook) {
        throw new BusinessError('ISBN already exists', HTTP_STATUS.CONFLICT, 'DUPLICATE_ISBN');
      }

      // Set available copies equal to total copies if not provided
      if (bookData.total_copies && !bookData.available_copies) {
        bookData.available_copies = bookData.total_copies;
      }

      const book = await Book.create(bookData);
      return book;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to create book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get all books with filtering and pagination
  async getAllBooks(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = {};
      
      // Apply filters
      if (filters.title) whereClause.title = { [Op.iLike]: `%${filters.title}%` };
      if (filters.author) whereClause.author = { [Op.iLike]: `%${filters.author}%` };
      if (filters.category) whereClause.category = filters.category;
      if (filters.status) whereClause.status = filters.status;
      if (filters.isbn) whereClause.isbn = filters.isbn;

      const offset = (page - 1) * limit;
      
      const { count, rows: books } = await Book.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        books,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch books', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get available books
  async getAvailableBooks(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows: books } = await Book.findAndCountAll({
        where: {
          status: BOOK_STATUS.AVAILABLE,
          available_copies: { [Op.gt]: 0 }
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['title', 'ASC']]
      });

      return {
        books,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to fetch available books', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Get book by ID
  async getBookById(id) {
    try {
      const book = await Book.findByPk(id);
      if (!book) {
        throw new BusinessError('Book not found', HTTP_STATUS.NOT_FOUND, 'BOOK_NOT_FOUND');
      }
      return book;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to fetch book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update book
  async updateBook(id, updateData) {
    try {
      const book = await this.getBookById(id);
      
      // Validate state transition if status is being updated
      if (updateData.status && updateData.status !== book.status) {
        if (!bookStateMachine.canTransition(book.status, updateData.status)) {
          throw new BusinessError(
            `Invalid status transition from ${book.status} to ${updateData.status}`,
            HTTP_STATUS.CONFLICT,
            'INVALID_STATUS_TRANSITION'
          );
        }
      }

      // Update available copies if total copies is changed
      if (updateData.total_copies && updateData.total_copies !== book.total_copies) {
        const diff = updateData.total_copies - book.total_copies;
        updateData.available_copies = Math.max(0, book.available_copies + diff);
      }

      await book.update(updateData);
      return book;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to update book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete book
  async deleteBook(id) {
    try {
      const book = await this.getBookById(id);
      
      // Check if book has active transactions
      const { Transaction } = require('../models');
      const activeTransactions = await Transaction.count({
        where: {
          book_id: id,
          status: 'active'
        }
      });

      if (activeTransactions > 0) {
        throw new BusinessError(
          'Cannot delete book with active transactions',
          HTTP_STATUS.CONFLICT,
          'BOOK_HAS_ACTIVE_TRANSACTIONS'
        );
      }

      await book.destroy();
      return { success: true, message: 'Book deleted successfully' };
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to delete book', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Update book status using state machine
  async updateBookStatus(id, newStatus) {
    try {
      const book = await this.getBookById(id);
      
      if (!bookStateMachine.canTransition(book.status, newStatus)) {
        throw new BusinessError(
          `Invalid status transition from ${book.status} to ${newStatus}`,
          HTTP_STATUS.CONFLICT,
          'INVALID_STATUS_TRANSITION'
        );
      }

      // Additional validation based on status
      if (newStatus === BOOK_STATUS.BORROWED && book.available_copies === 0) {
        throw new BusinessError(
          'No available copies to borrow',
          HTTP_STATUS.CONFLICT,
          'NO_AVAILABLE_COPIES'
        );
      }

      book.status = newStatus;
      await book.save();
      
      return book;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('Failed to update book status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Search books
  async searchBooks(query, page = 1, limit = 10) {
    try {
      const { Op } = require('sequelize');
      const offset = (page - 1) * limit;

      const { count, rows: books } = await Book.findAndCountAll({
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { author: { [Op.iLike]: `%${query}%` } },
            { isbn: { [Op.iLike]: `%${query}%` } },
            { category: { [Op.iLike]: `%${query}%` } }
          ]
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['title', 'ASC']]
      });

      return {
        books,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw new BusinessError('Failed to search books', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}

module.exports = new BookService();