const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { validateRequest, bookSchema } = require('../middleware/validation');

// CRUD operations
router.post('/', validateRequest(bookSchema), bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/available', bookController.getAvailableBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;