const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Borrow and return book
router.post('/borrow', transactionController.borrowBook);
router.post('/:id/return', transactionController.returnBook);

// Get transactions
router.get('/', transactionController.getAllTransactions);
router.get('/overdue', transactionController.getOverdueTransactions);
router.get('/:id', transactionController.getTransactionById);

module.exports = router;