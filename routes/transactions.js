const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');

// POST /transactions/borrow - Borrow a book
router.post('/borrow', transactionService.borrowBook);

// GET /transactions/overdue - Get all overdue transactions
router.get('/overdue', transactionService.getOverdueTransactions);

// POST /transactions/:id/return - Return a book
router.post('/:id/return', transactionService.returnBook);

module.exports = router;