const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', transactionController.getAllTransactions);
router.get('/overdue', transactionController.getOverdueTransactions);
router.get('/:id', transactionController.getTransactionById);
router.get('/member/:member_id/history', transactionController.getMemberBorrowingHistory);

// Protected routes
router.post('/borrow', validate(schemas.borrowBook), transactionController.borrowBook);
router.post('/:id/return', validate(schemas.returnBook), transactionController.returnBook);
router.post('/:id/renew', transactionController.renewBook);

module.exports = router;