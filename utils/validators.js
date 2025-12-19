const moment = require('moment');

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if member can borrow (not suspended, no unpaid fines, < 3 books borrowed)
const canMemberBorrow = async (pool, memberId) => {
  try {
    // Check member status
    const memberResult = await pool.query(
      'SELECT status FROM members WHERE id = $1',
      [memberId]
    );

    if (!memberResult.rows[0]) {
      return { canBorrow: false, reason: 'Member not found' };
    }

    if (memberResult.rows[0].status === 'suspended') {
      return { canBorrow: false, reason: 'Member is suspended' };
    }

    // Check for unpaid fines
    const finesResult = await pool.query(
      'SELECT COUNT(*) as unpaid_count FROM fines WHERE member_id = $1 AND paid_at IS NULL',
      [memberId]
    );

    if (finesResult.rows[0].unpaid_count > 0) {
      return { canBorrow: false, reason: 'Member has unpaid fines' };
    }

    // Check borrowed books count
    const booksResult = await pool.query(
      'SELECT COUNT(*) as borrowed_count FROM transactions WHERE member_id = $1 AND status = $2',
      [memberId, 'active']
    );

    if (booksResult.rows[0].borrowed_count >= 3) {
      return { canBorrow: false, reason: 'Member has borrowed maximum 3 books' };
    }

    return { canBorrow: true };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Calculate overdue fine
const calculateOverdueFine = (dueDate) => {
  const today = moment();
  const due = moment(dueDate);
  
  if (today.isBefore(due)) {
    return 0; // Not overdue
  }

  const daysOverdue = today.diff(due, 'days');
  return daysOverdue * 0.50; // $0.50 per day
};

module.exports = {
  validateEmail,
  canMemberBorrow,
  calculateOverdueFine,
};