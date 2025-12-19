-- Initialize database with sample data
-- This script runs when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional roles if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'library_app') THEN
        CREATE ROLE library_app WITH LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE library_db TO library_app;

-- Create sample data (optional - for development)
INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    '9780132350884',
    'Clean Code: A Handbook of Agile Software Craftsmanship',
    'Robert C. Martin',
    'Technology',
    5,
    5,
    'available',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9780132350884');

INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    '9780201633610',
    'Design Patterns: Elements of Reusable Object-Oriented Software',
    'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    'Technology',
    3,
    3,
    'available',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9780201633610');

INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    '9780321125217',
    'Domain-Driven Design: Tackling Complexity in the Heart of Software',
    'Eric Evans',
    'Technology',
    4,
    4,
    'available',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9780321125217');

INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    '9781593275846',
    'Eloquent JavaScript: A Modern Introduction to Programming',
    'Marijn Haverbeke',
    'Technology',
    6,
    6,
    'available',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9781593275846');

INSERT INTO books (id, isbn, title, author, category, total_copies, available_copies, status, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    '9780061120084',
    'To Kill a Mockingbird',
    'Harper Lee',
    'Fiction',
    8,
    8,
    'available',
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = '9780061120084');

-- Create sample members
INSERT INTO members (id, name, email, membership_number, status, max_borrow_limit, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'John Smith',
    'john.smith@example.com',
    'MEM' || LPAD(CAST(nextval('membership_seq') AS VARCHAR), 6, '0'),
    'active',
    3,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'john.smith@example.com');

INSERT INTO members (id, name, email, membership_number, status, max_borrow_limit, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'Sarah Johnson',
    'sarah.j@example.com',
    'MEM' || LPAD(CAST(nextval('membership_seq') AS VARCHAR), 6, '0'),
    'active',
    3,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'sarah.j@example.com');

INSERT INTO members (id, name, email, membership_number, status, max_borrow_limit, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'Michael Brown',
    'michael.b@example.com',
    'MEM' || LPAD(CAST(nextval('membership_seq') AS VARCHAR), 6, '0'),
    'active',
    3,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM members WHERE email = 'michael.b@example.com');

-- Create sequence for membership numbers if not exists
CREATE SEQUENCE IF NOT EXISTS membership_seq START 100001;