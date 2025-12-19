const pool = require('../config/database');
const { validateEmail } = require('../utils/validators');

// Create a new member
const createMember = async (req, res) => {
  try {
    const { name, email, membership_number } = req.body;

    // Validation
    if (!name || !email || !membership_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await pool.query(
      'INSERT INTO members (name, email, membership_number) VALUES ($1, $2, $3) RETURNING *',
      [name, email, membership_number]
    );

    res.status(201).json({
      message: 'Member created successfully',
      member: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email or membership number already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get all members
const getAllMembers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM members ORDER BY created_at DESC'
    );

    res.status(200).json({
      total: result.rows.length,
      members: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get a single member by ID
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM members WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get books borrowed by a member
const getMemberBorrowedBooks = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const memberResult = await pool.query(
      'SELECT * FROM members WHERE id = $1',
      [id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const result = await pool.query(
      `SELECT b.*, t.borrowed_at, t.due_date, t.status as transaction_status
       FROM books b
       JOIN transactions t ON b.id = t.book_id
       WHERE t.member_id = $1 AND t.status = $2
       ORDER BY t.borrowed_at DESC`,
      [id, 'active']
    );

    res.status(200).json({
      memberId: id,
      total: result.rows.length,
      borrowedBooks: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Update a member
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;

    // Check if member exists
    const checkResult = await pool.query(
      'SELECT * FROM members WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (email !== undefined) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `UPDATE members SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'Member updated successfully',
      member: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Delete a member
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const checkResult = await pool.query(
      'SELECT * FROM members WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await pool.query('DELETE FROM members WHERE id = $1', [id]);

    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete member with existing transactions' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  getMemberBorrowedBooks,
  updateMember,
  deleteMember,
};