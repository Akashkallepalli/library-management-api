const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', fineController.getAllFines);
router.get('/report', fineController.generateFineReport);
router.get('/:id', fineController.getFineById);
router.get('/member/:member_id', fineController.getMemberFines);

// Protected routes
router.post('/:id/pay', validate(schemas.payFine), fineController.payFine);
router.post('/:id/waive', fineController.waiveFine);
router.post('/calculate-overdue', fineController.calculateOverdueFines);

module.exports = router;