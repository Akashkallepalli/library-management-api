const express = require('express');
const router = express.Router();
const bookService = require('../services/bookService');

// POST /books - Create a new book
router.post('/', bookService.createBook);

// GET /books - Get all books
router.get('/', bookService.getAllBooks);

// GET /books/available - Get all available books
router.get('/available', bookService.getAvailableBooks);

// GET /books/:id - Get a single book
router.get('/:id', bookService.getBookById);

// PUT /books/:id - Update a book
router.put('/:id', bookService.updateBook);

// DELETE /books/:id - Delete a book
router.delete('/:id', bookService.deleteBook);

module.exports = router;