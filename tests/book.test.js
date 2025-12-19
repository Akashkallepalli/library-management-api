const request = require('supertest');
const app = require('../src/app');
const { Book, Member, Transaction, Fine, sequelize } = require('../src/models');
const { BUSINESS_RULES } = require('../src/utils/constants');

describe('Library Management System API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await Book.destroy({ where: {} });
    await Member.destroy({ where: {} });
    await Transaction.destroy({ where: {} });
    await Fine.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Book Management', () => {
    describe('POST /api/books', () => {
      it('should create a new book successfully', async () => {
        const bookData = {
          isbn: '9780132350884',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          category: 'Technology',
          total_copies: 5
        };

        const response = await request(app)
          .post('/api/books')
          .send(bookData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(bookData.title);
        expect(response.body.data.isbn).toBe(bookData.isbn);
        expect(response.body.data.status).toBe('available');
        expect(response.body.data.total_copies).toBe(5);
        expect(response.body.data.available_copies).toBe(5);
      });

      it('should return error for duplicate ISBN', async () => {
        await Book.create({
          isbn: '9780132350884',
          title: 'Existing Book',
          author: 'Author',
          category: 'Technology',
          total_copies: 3
        });

        const bookData = {
          isbn: '9780132350884',
          title: 'New Book',
          author: 'New Author',
          category: 'Technology',
          total_copies: 2
        };

        const response = await request(app)
          .post('/api/books')
          .send(bookData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('ISBN already exists');
      });

      it('should validate required fields', async () => {
        const invalidData = {
          title: 'Book without ISBN'
        };

        const response = await request(app)
          .post('/api/books')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('GET /api/books', () => {
      beforeEach(async () => {
        await Book.bulkCreate([
          {
            isbn: '9780132350884',
            title: 'Clean Code',
            author: 'Robert C. Martin',
            category: 'Technology',
            total_copies: 3,
            available_copies: 2,
            status: 'available'
          },
          {
            isbn: '9780201633610',
            title: 'Design Patterns',
            author: 'Gang of Four',
            category: 'Technology',
            total_copies: 2,
            available_copies: 0,
            status: 'borrowed'
          },
          {
            isbn: '9780321125217',
            title: 'Domain-Driven Design',
            author: 'Eric Evans',
            category: 'Technology',
            total_copies: 4,
            available_copies: 4,
            status: 'available'
          }
        ]);
      });

      it('should return all books with pagination', async () => {
        const response = await request(app)
          .get('/api/books')
          .query({ page: 1, limit: 2 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.books).toHaveLength(2);
        expect(response.body.pagination.total).toBe(3);
        expect(response.body.pagination.pages).toBe(2);
      });

      it('should filter books by status', async () => {
        const response = await request(app)
          .get('/api/books')
          .query({ status: 'available' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.books).toHaveLength(2);
        expect(response.body.books.every(book => book.status === 'available')).toBe(true);
      });

      it('should search books by title', async () => {
        const response = await request(app)
          .get('/api/books')
          .query({ title: 'Clean' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.books).toHaveLength(1);
        expect(response.body.books[0].title).toBe('Clean Code');
      });
    });

    describe('GET /api/books/available', () => {
      beforeEach(async () => {
        await Book.bulkCreate([
          {
            isbn: '1111111111',
            title: 'Available Book 1',
            author: 'Author 1',
            category: 'Fiction',
            total_copies: 3,
            available_copies: 3,
            status: 'available'
          },
          {
            isbn: '2222222222',
            title: 'Borrowed Book',
            author: 'Author 2',
            category: 'Fiction',
            total_copies: 1,
            available_copies: 0,
            status: 'borrowed'
          },
          {
            isbn: '3333333333',
            title: 'Available Book 2',
            author: 'Author 3',
            category: 'Non-Fiction',
            total_copies: 2,
            available_copies: 1,
            status: 'available'
          }
        ]);
      });

      it('should return only available books', async () => {
        const response = await request(app)
          .get('/api/books/available')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.books).toHaveLength(2);
        expect(response.body.books.every(book => 
          book.status === 'available' && book.available_copies > 0
        )).toBe(true);
      });
    });

    describe('GET /api/books/:id', () => {
      it('should return book details by ID', async () => {
        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          category: 'Technology',
          total_copies: 5,
          available_copies: 3
        });

        const response = await request(app)
          .get(`/api/books/${book.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(book.id);
        expect(response.body.data.title).toBe(book.title);
      });

      it('should return 404 for non-existent book', async () => {
        const response = await request(app)
          .get('/api/books/123e4567-e89b-12d3-a456-426614174000')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Book not found');
      });
    });

    describe('PUT /api/books/:id', () => {
      it('should update book details', async () => {
        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          category: 'Technology',
          total_copies: 5
        });

        const updateData = {
          title: 'Clean Code: Updated Edition',
          total_copies: 8
        };

        const response = await request(app)
          .put(`/api/books/${book.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.total_copies).toBe(8);
        expect(response.body.data.available_copies).toBe(8); // Should update available copies too
      });

      it('should validate book status transitions', async () => {
        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Test Book',
          author: 'Author',
          category: 'Technology',
          total_copies: 3,
          status: 'available'
        });

        // Try invalid transition: available -> reserved (should work)
        const response1 = await request(app)
          .put(`/api/books/${book.id}`)
          .send({ status: 'reserved' })
          .expect(200);

        expect(response1.body.success).toBe(true);

        // Try invalid transition: reserved -> overdue (should fail)
        const response2 = await request(app)
          .put(`/api/books/${response1.body.data.id}`)
          .send({ status: 'overdue' })
          .expect(409);

        expect(response2.body.success).toBe(false);
      });
    });

    describe('DELETE /api/books/:id', () => {
      it('should delete a book', async () => {
        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Book to Delete',
          author: 'Author',
          category: 'Technology',
          total_copies: 1
        });

        const response = await request(app)
          .delete(`/api/books/${book.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify book is deleted
        const deletedBook = await Book.findByPk(book.id);
        expect(deletedBook).toBeNull();
      });

      it('should prevent deletion of book with active transactions', async () => {
        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Book with Transaction',
          author: 'Author',
          category: 'Technology',
          total_copies: 1
        });

        const member = await Member.create({
          name: 'Test Member',
          email: 'test@example.com',
          membership_number: 'TEST001'
        });

        await Transaction.create({
          book_id: book.id,
          member_id: member.id,
          borrowed_at: new Date(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'active'
        });

        const response = await request(app)
          .delete(`/api/books/${book.id}`)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('active transactions');
      });
    });
  });

  describe('Member Management', () => {
    describe('POST /api/members', () => {
      it('should create a new member successfully', async () => {
        const memberData = {
          name: 'John Doe',
          email: 'john.doe@example.com',
          membership_number: 'MEM2024001',
          phone: '+1234567890',
          address: '123 Main St'
        };

        const response = await request(app)
          .post('/api/members')
          .send(memberData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(memberData.name);
        expect(response.body.data.email).toBe(memberData.email);
        expect(response.body.data.status).toBe('active');
        expect(response.body.data.max_borrow_limit).toBe(3);
      });

      it('should validate unique email and membership number', async () => {
        await Member.create({
          name: 'Existing Member',
          email: 'existing@example.com',
          membership_number: 'EXIST001'
        });

        const duplicateData = {
          name: 'New Member',
          email: 'existing@example.com',
          membership_number: 'NEW001'
        };

        const response1 = await request(app)
          .post('/api/members')
          .send(duplicateData)
          .expect(409);

        expect(response1.body.success).toBe(false);
        expect(response1.body.message).toContain('Email already exists');

        const duplicateMembershipData = {
          name: 'Another Member',
          email: 'another@example.com',
          membership_number: 'EXIST001'
        };

        const response2 = await request(app)
          .post('/api/members')
          .send(duplicateMembershipData)
          .expect(409);

        expect(response2.body.success).toBe(false);
        expect(response2.body.message).toContain('Membership number already exists');
      });
    });

    describe('GET /api/members/:id/borrowed', () => {
      it('should return borrowed books for a member', async () => {
        const member = await Member.create({
          name: 'John Doe',
          email: 'john@example.com',
          membership_number: 'MEM001'
        });

        const book = await Book.create({
          isbn: '9780132350884',
          title: 'Test Book',
          author: 'Author',
          category: 'Technology',
          total_copies: 3
        });

        await Transaction.create({
          book_id: book.id,
          member_id: member.id,
          borrowed_at: new Date(),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active'
        });

        const response = await request(app)
          .get(`/api/members/${member.id}/borrowed`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.borrowed_books).toHaveLength(1);
        expect(response.body.total_borrowed).toBe(1);
      });
    });
  });

  describe('Transaction Management', () => {
    let member, book1, book2, book3, book4;

    beforeEach(async () => {
      member = await Member.create({
        name: 'Test Borrower',
        email: 'borrower@example.com',
        membership_number: 'BORROW001'
      });

      book1 = await Book.create({
        isbn: '1111111111',
        title: 'Book 1',
        author: 'Author 1',
        category: 'Fiction',
        total_copies: 3,
        available_copies: 3
      });

      book2 = await Book.create({
        isbn: '2222222222',
        title: 'Book 2',
        author: 'Author 2',
        category: 'Fiction',
        total_copies: 2,
        available_copies: 2
      });

      book3 = await Book.create({
        isbn: '3333333333',
        title: 'Book 3',
        author: 'Author 3',
        category: 'Non-Fiction',
        total_copies: 1,
        available_copies: 1
      });

      book4 = await Book.create({
        isbn: '4444444444',
        title: 'Book 4',
        author: 'Author 4',
        category: 'Non-Fiction',
        total_copies: 1,
        available_copies: 1
      });
    });

    describe('POST /api/transactions/borrow', () => {
      it('should allow member to borrow a book', async () => {
        const borrowData = {
          book_id: book1.id,
          member_id: member.id
        };

        const response = await request(app)
          .post('/api/transactions/borrow')
          .send(borrowData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('borrowed successfully');
        expect(response.body.transaction.book_id).toBe(book1.id);
        expect(response.body.transaction.member_id).toBe(member.id);
        expect(response.body.transaction.status).toBe('active');

        // Verify book availability updated
        const updatedBook = await Book.findByPk(book1.id);
        expect(updatedBook.available_copies).toBe(2);
      });

      it('should enforce borrowing limit (max 3 books)', async () => {
        // Borrow first 3 books
        for (let i = 0; i < 3; i++) {
          const books = [book1, book2, book3];
          await request(app)
            .post('/api/transactions/borrow')
            .send({
              book_id: books[i].id,
              member_id: member.id
            })
            .expect(201);
        }

        // Try to borrow fourth book
        const response = await request(app)
          .post('/api/transactions/borrow')
          .send({
            book_id: book4.id,
            member_id: member.id
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Borrowing limit reached');
      });

      it('should prevent borrowing unavailable book', async () => {
        // Make book unavailable
        await book1.update({ available_copies: 0, status: 'borrowed' });

        const response = await request(app)
          .post('/api/transactions/borrow')
          .send({
            book_id: book1.id,
            member_id: member.id
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not available');
      });

      it('should prevent borrowing by suspended member', async () => {
        await member.update({ status: 'suspended' });

        const response = await request(app)
          .post('/api/transactions/borrow')
          .send({
            book_id: book1.id,
            member_id: member.id
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Member is suspended');
      });
    });

    describe('POST /api/transactions/:id/return', () => {
      it('should allow returning a book', async () => {
        // First borrow a book
        const borrowResponse = await request(app)
          .post('/api/transactions/borrow')
          .send({
            book_id: book1.id,
            member_id: member.id
          })
          .expect(201);

        const transactionId = borrowResponse.body.transaction.id;

        // Return the book
        const returnResponse = await request(app)
          .post(`/api/transactions/${transactionId}/return`)
          .send({ condition: 'good' })
          .expect(200);

        expect(returnResponse.body.success).toBe(true);
        expect(returnResponse.body.message).toContain('returned successfully');
        expect(returnResponse.body.transaction.status).toBe('returned');

        // Verify book availability restored
        const updatedBook = await Book.findByPk(book1.id);
        expect(updatedBook.available_copies).toBe(3);
      });

      it('should calculate overdue fine', async () => {
        const transaction = await Transaction.create({
          book_id: book1.id,
          member_id: member.id,
          borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
          due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days overdue
          status: 'overdue'
        });

        const response = await request(app)
          .post(`/api/transactions/${transaction.id}/return`)
          .send({ condition: 'good' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.overdue_days).toBeGreaterThan(0);
        expect(response.body.fine_amount).toBeGreaterThan(0);
        expect(response.body.fine_amount).toBe(response.body.overdue_days * BUSINESS_RULES.OVERDUE_FINE_RATE);
      });

      it('should apply damage fee for damaged book', async () => {
        const transaction = await Transaction.create({
          book_id: book1.id,
          member_id: member.id,
          borrowed_at: new Date(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'active'
        });

        const response = await request(app)
          .post(`/api/transactions/${transaction.id}/return`)
          .send({ condition: 'damaged', notes: 'Cover torn' })
          .expect(200);

        expect(response.body.success).toBe(true);

        // Check if damage fine was created
        const fines = await Fine.findAll({
          where: { transaction_id: transaction.id }
        });

        expect(fines.length).toBeGreaterThan(0);
        const damageFine = fines.find(f => f.reason.includes('damage'));
        expect(damageFine).toBeDefined();
        expect(parseFloat(damageFine.amount)).toBe(10); // $10 damage fee
      });
    });

    describe('GET /api/transactions/overdue', () => {
      it('should list overdue transactions', async () => {
        // Create overdue transaction
        await Transaction.create({
          book_id: book1.id,
          member_id: member.id,
          borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          status: 'overdue'
        });

        const response = await request(app)
          .get('/api/transactions/overdue')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.transactions.length).toBeGreaterThan(0);
        expect(response.body.total_overdue_books).toBeGreaterThan(0);
      });
    });
  });

  describe('Fine Management', () => {
    let member, transaction, fine;

    beforeEach(async () => {
      member = await Member.create({
        name: 'John Doe',
        email: 'john@example.com',
        membership_number: 'MEM001'
      });

      const book = await Book.create({
        isbn: '9780132350884',
        title: 'Test Book',
        author: 'Author',
        category: 'Technology',
        total_copies: 3
      });

      transaction = await Transaction.create({
        book_id: book.id,
        member_id: member.id,
        borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        returned_at: new Date(),
        status: 'returned',
        overdue_days: 6,
        calculated_fine: 3.00
      });

      fine = await Fine.create({
        member_id: member.id,
        transaction_id: transaction.id,
        amount: 3.00,
        reason: 'Overdue fine for 6 days',
        status: 'pending'
      });
    });

    describe('POST /api/fines/:id/pay', () => {
      it('should allow paying a fine', async () => {
        const paymentData = {
          payment_method: 'card',
          amount_paid: 3.00,
          transaction_reference: 'TXN123456'
        };

        const response = await request(app)
          .post(`/api/fines/${fine.id}/pay`)
          .send(paymentData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('paid successfully');
        expect(response.body.fine.status).toBe('paid');

        // Verify member's fine totals updated
        const updatedMember = await Member.findByPk(member.id);
        expect(parseFloat(updatedMember.total_fines_paid)).toBe(3.00);
        expect(parseFloat(updatedMember.total_fines_owed)).toBe(0);
      });

      it('should reject insufficient payment', async () => {
        const paymentData = {
          payment_method: 'cash',
          amount_paid: 2.00, // Less than fine amount
          transaction_reference: 'TXN123456'
        };

        const response = await request(app)
          .post(`/api/fines/${fine.id}/pay`)
          .send(paymentData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Insufficient payment');
      });

      it('should handle overpayment and return change', async () => {
        const paymentData = {
          payment_method: 'cash',
          amount_paid: 5.00, // More than fine amount
          transaction_reference: 'TXN123456'
        };

        const response = await request(app)
          .post(`/api/fines/${fine.id}/pay`)
          .send(paymentData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.change).toBe(2.00); // $5.00 - $3.00 = $2.00 change
      });
    });

    describe('GET /api/fines/member/:member_id', () => {
      it('should list fines for a member', async () => {
        const response = await request(app)
          .get(`/api/fines/member/${member.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.fines).toHaveLength(1);
        expect(response.body.summary.total_owed).toBe('3.00');
        expect(response.body.summary.total_pending).toBe('3.00');
      });
    });
  });

  describe('Business Rule: Auto-suspension', () => {
    it('should automatically suspend member with 3+ overdue books', async () => {
      const member = await Member.create({
        name: 'Overdue Member',
        email: 'overdue@example.com',
        membership_number: 'OVERDUE001'
      });

      const book1 = await Book.create({
        isbn: '1111111111',
        title: 'Book 1',
        author: 'Author',
        category: 'Fiction',
        total_copies: 3
      });

      const book2 = await Book.create({
        isbn: '2222222222',
        title: 'Book 2',
        author: 'Author',
        category: 'Fiction',
        total_copies: 3
      });

      const book3 = await Book.create({
        isbn: '3333333333',
        title: 'Book 3',
        author: 'Author',
        category: 'Fiction',
        total_copies: 3
      });

      // Create 3 overdue transactions
      await Transaction.bulkCreate([
        {
          book_id: book1.id,
          member_id: member.id,
          borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          status: 'overdue'
        },
        {
          book_id: book2.id,
          member_id: member.id,
          borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          status: 'overdue'
        },
        {
          book_id: book3.id,
          member_id: member.id,
          borrowed_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          due_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          status: 'overdue'
        }
      ]);

      // Try to borrow another book - should trigger auto-suspension
      const book4 = await Book.create({
        isbn: '4444444444',
        title: 'Book 4',
        author: 'Author',
        category: 'Fiction',
        total_copies: 3
      });

      const response = await request(app)
        .post('/api/transactions/borrow')
        .send({
          book_id: book4.id,
          member_id: member.id
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('has been suspended');

      // Verify member is suspended
      const updatedMember = await Member.findByPk(member.id);
      expect(updatedMember.status).toBe('suspended');
    });
  });

  describe('Business Rule: Unpaid Fines Block', () => {
    it('should prevent borrowing when member has unpaid fines', async () => {
      const member = await Member.create({
        name: 'Fined Member',
        email: 'fined@example.com',
        membership_number: 'FINED001'
      });

      const book = await Book.create({
        isbn: '1111111111',
        title: 'Test Book',
        author: 'Author',
        category: 'Fiction',
        total_copies: 3
      });

      // Create an unpaid fine
      await Fine.create({
        member_id: member.id,
        transaction_id: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10.00,
        reason: 'Overdue fine',
        status: 'pending'
      });

      // Update member's owed amount
      await member.update({ total_fines_owed: 10.00 });

      // Try to borrow a book
      const response = await request(app)
        .post('/api/transactions/borrow')
        .send({
          book_id: book.id,
          member_id: member.id
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('unpaid fines');
    });
  });
});