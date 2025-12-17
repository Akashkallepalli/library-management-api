const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');

router.get('/', fineController.getAllFines);
router.get('/:id', fineController.getFineById);
router.post('/:id/pay', fineController.markFinePaid);

module.exports = router;