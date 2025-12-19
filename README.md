# 📚 Library Management System API

A comprehensive RESTful API for managing library operations including books, members, borrowing transactions, and fines.

## Features

✅ Full CRUD operations for books and members  
✅ Borrowing and returning system with 14-day loan period  
✅ Automatic fine calculation ($0.50/day for overdue books)  
✅ Member suspension on 3 concurrent overdue books  
✅ Borrowing limit enforcement (max 3 books per member)  
✅ Overdue transaction tracking and reporting  
✅ Fine management and payment tracking  

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Package Manager:** npm
- **Testing:** Postman

## Prerequisites

- Node.js v14+ 
- PostgreSQL 12+
- Postman (for testing)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Akashkallepalli/library-management-api.git
cd library-management-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup database
- Create PostgreSQL database
- Run SQL schema from `database_schema.sql`

### 4. Create .env file
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
PORT=3000
NODE_ENV=development
```

### 5. Start server
```bash
npm run dev
```

## API Endpoints

### Books
- `POST /api/books` - Create book
- `GET /api/books` - Get all books
- `GET /api/books/available` - Get available books
- `GET /api/books/:id` - Get book by ID
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members
- `POST /api/members` - Create member
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `GET /api/members/:id/borrowed` - Get borrowed books
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Transactions
- `POST /api/transactions/borrow` - Borrow book
- `POST /api/transactions/:id/return` - Return book
- `GET /api/transactions/overdue` - Get overdue transactions

### Fines
- `GET /api/fines` - Get all fines
- `GET /api/fines/member/:memberId` - Get member fines
- `POST /api/fines/:id/pay` - Mark fine as paid

## Business Rules Enforced

1. **Borrowing Limit:** Max 3 books per member simultaneously
2. **Loan Period:** 14 days from borrowing date
3. **Fine Calculation:** $0.50 per day overdue
4. **Member Suspension:** Automatic on 3+ concurrent overdue books
5. **Borrowing Restriction:** Members with unpaid fines cannot borrow

## Testing

1. Import `Library-API.postman_collection.json` into Postman
2. Run test requests
3. Verify responses match expected formats

## License

MIT
```

---

## Deployment (Optional)

### Deploy to Heroku

```bash
# 1. Create Heroku account at heroku.com

# 2. Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# 3. Login to Heroku
heroku login

# 4. Create app
heroku create your-app-name

# 5. Set environment variables
heroku config:set DB_USER=your_db_user
heroku config:set DB_PASSWORD=your_db_password
heroku config:set DB_HOST=your_db_host
heroku config:set DB_NAME=your_db_name

# 6. Push to Heroku
git push heroku main
```

---

## Troubleshooting

### "Database connection failed"
- Check if PostgreSQL is running
- Verify .env credentials
- Ensure database exists

### "Port 3000 already in use"
```bash
# Change PORT in .env or
npx kill-port 3000
```

### "npm install fails"
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

---

## Support & Contact

For issues or questions, please open a GitHub issue.