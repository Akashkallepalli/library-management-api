
# Library Management System API

A comprehensive RESTful API for managing library operations including books, members, borrowing transactions, and fines.[file:2]

## Features

- Complete CRUD operations for books and members.[file:2]
- Borrow and return book transactions.[file:2]
- Automatic fine calculation for overdue books.[file:2]
- Member suspension when multiple books are overdue.[file:2]
- Borrowing limit enforcement (max 3 active books per member).[file:2]
- Prevention of borrowing when unpaid fines exist.[file:2]
- 14‑day standard loan period.[file:2]
- Overdue fine of 0.50 per day.[file:2]

## Tech Stack

- Runtime: Node.js.[file:2]
- Framework: Express.js.[file:2]
- Database: PostgreSQL.[file:2]
- ORM: Sequelize.[file:2]
- Validation: Joi.[file:2]
- Date/Time: moment.js.[file:2]

## Prerequisites

- Node.js v14 or higher.[file:2]
- PostgreSQL v12 or higher.[file:2]
- npm or yarn installed.[file:2]

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Akashkallepalli/library-management-api.git
cd library-management-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Database

```bash
psql -U postgres
CREATE DATABASE library_management_db;
\q
```

### 4. Configure Environment

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=library_management_db
DB_PORT=5432

API_VERSION=v1
```

### 5. Run the Application

```bash
npm run dev
```

Server will be available at:

- Base URL: `http://localhost:3000`
- API base: `http://localhost:3000/api/v1`

## API Endpoints

### Books

- `POST /api/v1/books` — Create book
- `GET /api/v1/books` — Get all books
- `GET /api/v1/books/available` — Get available books
- `GET /api/v1/books/:id` — Get book by ID
- `PUT /api/v1/books/:id` — Update book
- `DELETE /api/v1/books/:id` — Delete book

### Members

- `POST /api/v1/members` — Create member
- `GET /api/v1/members` — Get all members
- `GET /api/v1/members/:id` — Get member by ID
- `PUT /api/v1/members/:id` — Update member
- `DELETE /api/v1/members/:id` — Delete member
- `GET /api/v1/members/:id/borrowed` — Get borrowed books for a member

### Transactions

- `POST /api/v1/transactions/borrow` — Borrow book
- `POST /api/v1/transactions/:id/return` — Return book
- `GET /api/v1/transactions` — Get all transactions
- `GET /api/v1/transactions/overdue` — Get overdue transactions
- `GET /api/v1/transactions/:id` — Get transaction by ID

### Fines

- `GET /api/v1/fines` — Get all fines
- `GET /api/v1/fines/:id` — Get fine by ID
- `POST /api/v1/fines/:id/pay` — Mark fine as paid

## Database Schema (Overview)

### Books

- `id` (UUID, PK)
- `isbn` (VARCHAR, unique)
- `title` (VARCHAR)
- `author` (VARCHAR)
- `category` (VARCHAR)
- `status` (ENUM: `available`, `borrowed`, `reserved`, `maintenance`)
- `total_copies` (INTEGER)
- `available_copies` (INTEGER)

### Members

- `id` (UUID, PK)
- `name` (VARCHAR)
- `email` (VARCHAR, unique)
- `membership_number` (VARCHAR, unique)
- `status` (ENUM: `active`, `suspended`)

### Transactions

- `id` (UUID, PK)
- `book_id` (UUID, FK → books)
- `member_id` (UUID, FK → members)
- `borrowed_at` (TIMESTAMP)
- `due_date` (TIMESTAMP)
- `returned_at` (TIMESTAMP, nullable)
- `status` (ENUM: `active`, `returned`, `overdue`)

### Fines

- `id` (UUID, PK)
- `member_id` (UUID, FK → members)
- `transaction_id` (UUID, FK → transactions)
- `amount` (DECIMAL)
- `paid_at` (TIMESTAMP, nullable)

## Business Rules (Summary)

- Max 3 concurrent books per member
- Loan period: 14 days
- Overdue fine: 0.50 per day
- Block borrowing if member has unpaid fines
- Automatically suspend member on 3+ overdue books

## Example Requests

### Create Book

```http
POST /api/v1/books
Content-Type: application/json

{
  "isbn": "9780134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "total_copies": 5
}
```

### Create Member

```http
POST /api/v1/members
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Borrow Book

```http
POST /api/v1/transactions/borrow
Content-Type: application/json

{
  "member_id": "uuid-here",
  "book_id": "uuid-here"
}
```

## Project Structure

```
library-management-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Book.js
│   │   ├── Member.js
│   │   ├── Transaction.js
│   │   └── Fine.js
│   ├── controllers/
│   │   ├── bookController.js
│   │   ├── memberController.js
│   │   ├── transactionController.js
│   │   └── fineController.js
│   ├── services/
│   │   ├── bookService.js
│   │   ├── memberService.js
│   │   ├── transactionService.js
│   │   └── fineService.js
│   ├── routes/
│   │   ├── bookRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── fineRoutes.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   └── index.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Testing

- Use Postman (or any REST client) to call the endpoints
- Optionally import the provided Postman collection if available

## Error Handling

Standard HTTP status codes:

- `200` — OK
- `201` — Created
- `400` — Bad Request
- `404` — Not Found
- `409` — Conflict (business rule violation)
- `500` — Internal Server Error

## Git Commands & Version Control

```bash
# Initialize repository
git init
git config user.name "Akashkallepalli"
git config user.email "23mh1a1220@acoe.edu.in"

# Commit workflow
git add .
git commit -m "Your commit message"
git push origin main
```

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running
- Check `.env` database credentials
- Ensure database `library_management_db` exists

### Port Already in Use

- Change `PORT` in `.env` file
- Or kill the process: `netstat -ano | findstr :3000` (Windows)

### Module Not Found

- Run `npm install` to reinstall dependencies
- Check node_modules folder exists

## License

MIT

## Author

Kallepalli Akash Sai Ganesh Govind— 2025