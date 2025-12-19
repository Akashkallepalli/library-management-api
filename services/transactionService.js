const pool = require('../config/database');
const moment = require('moment');
const { canMemberBorrow, calculateOverdueFine } = require('../utils/validators');

// Borrow a book
const borrowBook = async (req, res) => {
  try {
    const { book_id, member_id } = req.body;

    // Validation
    if (!book_id || !member_id) {
      return res.status(400).json({ error: 'Missing required fields: book_id, member_id' });
    }

    // Check if member can borrow
    const canBorrow = await canMemberBorrow(pool, member_id);
    if (!canBorrow.canBorrow) {
      return res.status(403).json({ error: canBorrow.reason });
    }

    // Check if book exists and is available
    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [book_id]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = bookResult.rows[0];

    if (book.status === 'borrowed' || book.available_copies <= 0) {
      return res.status(409).json({ error: 'Book is not available for borrowing' });
    }

    // Create transaction with 14-day due date
    const borrowedAt = moment();
    const dueDate = borrowedAt.clone().add(14, 'days');

    const transactionResult = await pool.query(
      `INSERT INTO transactions (book_id, member_id, borrowed_at, due_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [book_id, member_id, borrowedAt.toDate(), dueDate.toDate(), 'active']
    );

    // Update book status and available copies
    await pool.query(
      `UPDATE books 
       SET available_copies = available_copies - 1, 
           status = CASE WHEN available_copies - 1 = 0 THEN 'borrowed' ELSE 'available' END
       WHERE id = $1`,
      [book_id]
    );

    res.status(201).json({
      message: 'Book borrowed successfully',
      transaction: transactionResult.rows[0],
      dueDate: dueDate.format('YYYY-MM-DD'),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Return a book
const returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const transactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];

    if (transaction.status !== 'active') {
      return res.status(409).json({ error: 'Transaction is not active' });
    }

    const returnedAt = moment();
    const dueDate = moment(transaction.due_date);
    const isOverdue = returnedAt.isAfter(dueDate);

    // Calculate fine if overdue
    let fineAmount = 0;
    if (isOverdue) {
      fineAmount = calculateOverdueFine(transaction.due_date);
    }

    // Update transaction
    const updateResult = await pool.query(
      `UPDATE transactions 
       SET returned_at = $1, status = $2
       WHERE id = $3
       RETURNING *`,
      [returnedAt.toDate(), 'returned', id]
    );

    // Update book status and available copies
    await pool.query(
      `UPDATE books 
       SET available_copies = available_copies + 1, 
           status = 'available'
       WHERE id = $1`,
      [transaction.book_id]
    );

    // Create fine if overdue
    let fineRecord = null;
    if (fineAmount > 0) {
      const fineResult = await pool.query(
        `INSERT INTO fines (member_id, transaction_id, amount)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [transaction.member_id, id, fineAmount]
      );
      fineRecord = fineResult.rows[0];

      // Check if member should be suspended (3 or more overdue books)
      const overdueResult = await pool.query(
        `SELECT COUNT(*) as overdue_count 
         FROM transactions 
         WHERE member_id = $1 AND status = 'overdue'`,
        [transaction.member_id]
      );

      if (overdueResult.rows[0].overdue_count >= 3) {
        await pool.query(
          `UPDATE members SET status = 'suspended' WHERE id = $1`,
          [transaction.member_id]
        );
      }
    }

    res.status(200).json({
      message: 'Book returned successfully',
      transaction: updateResult.rows[0],
      fine: fineRecord ? { amount: fineAmount, fineId: fineRecord.id } : null,
      isOverdue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get all overdue transactions
const getOverdueTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, b.title, b.author, m.name, m.email
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       JOIN members m ON t.member_id = m.id
       WHERE t.status = 'active' AND t.due_date < CURRENT_TIMESTAMP
       ORDER BY t.due_date ASC`
    );

    const overdueWithFines = result.rows.map((transaction) => {
      const fineAmount = calculateOverdueFine(transaction.due_date);
      return {
        ...transaction,
        daysOverdue: moment().diff(moment(transaction.due_date), 'days'),
        estimatedFine: fineAmount,
      };
    });

    res.status(200).json({
      total: overdueWithFines.length,
      overdueTransactions: overdueWithFines,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getOverdueTransactions,
};