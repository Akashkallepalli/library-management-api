const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/available', bookController.getAvailableBooks);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBookById);

// Protected routes (add authentication middleware in production)
router.post('/', validate(schemas.createBook), bookController.createBook);
router.put('/:id', validate(schemas.updateBook), bookController.updateBook);
router.delete('/:id', bookController.deleteBook);
router.patch('/:id/status', bookController.updateBookStatus);

module.exports = router;