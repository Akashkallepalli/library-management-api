const pool = require('../config/database');

// Get all fines
const getAllFines = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, m.name, m.email, b.title
       FROM fines f
       JOIN members m ON f.member_id = m.id
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       ORDER BY f.created_at DESC`
    );

    res.status(200).json({
      total: result.rows.length,
      fines: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Mark a fine as paid
const markFinePaid = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if fine exists
    const fineResult = await pool.query(
      'SELECT * FROM fines WHERE id = $1',
      [id]
    );

    if (fineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    const fine = fineResult.rows[0];

    if (fine.paid_at !== null) {
      return res.status(409).json({ error: 'Fine is already paid' });
    }

    // Mark fine as paid
    const result = await pool.query(
      `UPDATE fines SET paid_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    // Check if member can be unsuspended (no more unpaid fines)
    const unpaidFinesResult = await pool.query(
      `SELECT COUNT(*) as unpaid_count 
       FROM fines 
       WHERE member_id = $1 AND paid_at IS NULL`,
      [fine.member_id]
    );

    if (unpaidFinesResult.rows[0].unpaid_count === 0) {
      await pool.query(
        `UPDATE members SET status = 'active' WHERE id = $1`,
        [fine.member_id]
      );
    }

    res.status(200).json({
      message: 'Fine marked as paid',
      fine: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get unpaid fines for a member
const getMemberUnpaidFines = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Check if member exists
    const memberResult = await pool.query(
      'SELECT * FROM members WHERE id = $1',
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const result = await pool.query(
      `SELECT f.*, b.title 
       FROM fines f
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       WHERE f.member_id = $1 AND f.paid_at IS NULL
       ORDER BY f.created_at DESC`,
      [memberId]
    );

    const totalUnpaid = result.rows.reduce((sum, fine) => sum + parseFloat(fine.amount), 0);

    res.status(200).json({
      memberId,
      totalUnpaidFines: totalUnpaid,
      fines: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  getAllFines,
  markFinePaid,
  getMemberUnpaidFines,
};