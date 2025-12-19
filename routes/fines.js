const express = require('express');
const router = express.Router();
const fineService = require('../services/fineService');

// GET /fines - Get all fines
router.get('/', fineService.getAllFines);

// GET /fines/member/:memberId - Get unpaid fines for a member
router.get('/member/:memberId', fineService.getMemberUnpaidFines);

// POST /fines/:id/pay - Mark a fine as paid
router.post('/:id/pay', fineService.markFinePaid);

module.exports = router;