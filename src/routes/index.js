const express = require('express');
const router = express.Router();

const bookRoutes = require('./bookRoutes');
const memberRoutes = require('./memberRoutes');
const transactionRoutes = require('./transactionRoutes');
const fineRoutes = require('./fineRoutes');

router.use('/books', bookRoutes);
router.use('/members', memberRoutes);
router.use('/transactions', transactionRoutes);
router.use('/fines', fineRoutes);

module.exports = router;