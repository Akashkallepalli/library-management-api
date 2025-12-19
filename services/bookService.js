const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Create a new book
const createBook = async (req, res) => {
  try {
    const { isbn, title, author, category, total_copies = 1 } = req.body;

    // Validate input
    if (!isbn || !title || !author || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO books (isbn, title, author, category, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [isbn, title, author, category, total_copies, total_copies]
    );

    res.status(201).json({
      message: 'Book created successfully',
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'ISBN already exists' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get all books
const getAllBooks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books ORDER BY created_at DESC'
    );

    res.status(200).json({
      total: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Get all available books
const getAvailableBooks = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE status = $1 AND available_copies > 0 ORDER BY created_at DESC',
      ['available']
    );

    res.status(200).json({
      total: result.rows.length,
      books: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Update a book
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, total_copies, status } = req.body;

    // Check if book exists
    const checkResult = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const currentBook = checkResult.rows[0];

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (author !== undefined) {
      updates.push(`author = $${paramCount}`);
      values.push(author);
      paramCount++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (total_copies !== undefined) {
      updates.push(`total_copies = $${paramCount}`);
      values.push(total_copies);
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

    const query = `UPDATE books SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.status(200).json({
      message: 'Book updated successfully',
      book: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const checkResult = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await pool.query('DELETE FROM books WHERE id = $1', [id]);

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === '23503') {
      return res.status(409).json({ error: 'Cannot delete book with existing transactions' });
    }
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  getAvailableBooks,
  updateBook,
  deleteBook,
};