const Book = require('../models/Book');
const { BOOK_STATUS, HTTP_STATUS } = require('../utils/constants');

class BookService {
  // Create new book
  async createBook(bookData) {
    try {
      const book = await Book.create({
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        category: bookData.category,
        total_copies: bookData.total_copies,
        available_copies: bookData.total_copies,
        status: BOOK_STATUS.AVAILABLE,
      });
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all books
  async getAllBooks() {
    try {
      const books = await Book.findAll();
      return { success: true, books };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get available books
  async getAvailableBooks() {
    try {
      const books = await Book.findAll({
        where: { status: BOOK_STATUS.AVAILABLE },
      });
      return { success: true, books };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get book by ID
  async getBookById(bookId) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update book
  async updateBook(bookId, updateData) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      await book.update(updateData);
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete book
  async deleteBook(bookId) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      await book.destroy();
      return { success: true, message: 'Book deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update book status
  async updateBookStatus(bookId, status) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      await book.update({ status });
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Decrease available copies
  async decreaseAvailableCopies(bookId) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      if (book.available_copies <= 0) {
        return { success: false, error: 'No copies available' };
      }

      book.available_copies -= 1;
      if (book.available_copies === 0) {
        book.status = BOOK_STATUS.BORROWED;
      }

      await book.save();
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Increase available copies
  async increaseAvailableCopies(bookId) {
    try {
      const book = await Book.findByPk(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      book.available_copies += 1;
      if (book.status !== BOOK_STATUS.AVAILABLE && book.available_copies > 0) {
        book.status = BOOK_STATUS.AVAILABLE;
      }

      await book.save();
      return { success: true, book };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BookService();