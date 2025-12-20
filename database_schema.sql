-- Library Management System - Database Schema
-- PostgreSQL SQL Script
-- Creates all tables, constraints, and indexes for the library system

-- =====================================================
-- TABLE 1: BOOKS
-- =====================================================
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 2: MEMBERS
-- =====================================================
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  membership_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 3: TRANSACTIONS
-- =====================================================
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  book_id INT NOT NULL REFERENCES books(id),
  member_id INT NOT NULL REFERENCES members(id),
  borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  returned_at TIMESTAMP NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE 4: FINES
-- =====================================================
CREATE TABLE fines (
  id SERIAL PRIMARY KEY,
  member_id INT NOT NULL REFERENCES members(id),
  transaction_id INT NOT NULL REFERENCES transactions(id),
  amount DECIMAL(10, 2) NOT NULL,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Books indexes
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_isbn ON books(isbn);

-- Members indexes
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_membership ON members(membership_number);

-- Transactions indexes
CREATE INDEX idx_transactions_member ON transactions(member_id);
CREATE INDEX idx_transactions_book ON transactions(book_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Fines indexes
CREATE INDEX idx_fines_member ON fines(member_id);
CREATE INDEX idx_fines_transaction ON fines(transaction_id);

-- =====================================================
-- COMMENTS (For Documentation)
-- =====================================================

COMMENT ON TABLE books IS 'Stores book inventory information';
COMMENT ON TABLE members IS 'Stores library member information';
COMMENT ON TABLE transactions IS 'Stores borrowing and returning transactions';
COMMENT ON TABLE fines IS 'Stores fine records for overdue books';

COMMENT ON COLUMN books.isbn IS 'International Standard Book Number - Unique identifier for books';
COMMENT ON COLUMN books.status IS 'Current availability status of the book';
COMMENT ON COLUMN books.total_copies IS 'Total number of copies in the library';
COMMENT ON COLUMN books.available_copies IS 'Number of copies currently available for borrowing';

COMMENT ON COLUMN members.status IS 'Active or suspended status (suspended if 3+ overdue books)';
COMMENT ON COLUMN members.membership_number IS 'Unique membership identifier';

COMMENT ON COLUMN transactions.due_date IS 'Return due date (automatically set to 14 days from borrow date)';
COMMENT ON COLUMN transactions.status IS 'Transaction status (active, returned, or overdue)';

COMMENT ON COLUMN fines.amount IS 'Fine amount in currency ($0.50 per day overdue)';
COMMENT ON COLUMN fines.paid_at IS 'Timestamp when fine was paid (NULL if unpaid)';

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment below to insert sample data after creating schema

/*
-- Insert sample books
INSERT INTO books (isbn, title, author, category, total_copies, available_copies) VALUES
('978-0-7432-7356-5', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Classic Fiction', 5, 5),
('978-0-06-112008-4', 'To Kill a Mockingbird', 'Harper Lee', 'Classic Fiction', 3, 3),
('978-0-451-52494-2', '1984', 'George Orwell', 'Dystopian Fiction', 4, 4),
('978-0-14-143951-8', 'Pride and Prejudice', 'Jane Austen', 'Romance', 2, 2);

-- Insert sample members
INSERT INTO members (name, email, membership_number) VALUES
('Alice Johnson', 'alice@example.com', 'LIB001'),
('Bob Smith', 'bob@example.com', 'LIB002'),
('Carol White', 'carol@example.com', 'LIB003'),
('David Brown', 'david@example.com', 'LIB004');
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
