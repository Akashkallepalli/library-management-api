# Library Management System API

A comprehensive RESTful API for managing library operations with state machines and business rule enforcement. Built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- Complete CRUD Operations for Books, Members, Transactions, and Fines
- **State Machine Implementation** for book and member status management
- **Business Rule Enforcement** including borrowing limits, overdue fines, and member suspensions
- Advanced Search & Filtering capabilities with pagination
- Comprehensive Reporting with overdue transactions and fine calculations
- Database Transactions for data integrity
- Input Validation & Error Handling with proper HTTP status codes
- Rate Limiting & Security Headers for production readiness
- Docker Support for easy deployment

## 📋 Prerequisites

- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- npm or yarn package manager
- Git (for cloning the repository)

## 🛠️ Installation

### Method 1: Local Installation

1. **Clone the repository:**
git clone https://github.com/Akashkallepalli/library-management-api.git
cd library-management-api

text

2. **Install dependencies:**
npm install

text

3. **Set up environment variables:**
cp .env.example .env

Edit .env with your database credentials
text

4. **Configure PostgreSQL database:**
-- Connect to PostgreSQL
psql -U postgres

-- Create database and user
CREATE DATABASE library_db;
CREATE USER library_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;

-- Exit psql
\q

text

5. **Run database migrations:**
npm run migrate

text

6. **Start the server:**
Development mode with hot reload
npm run dev

Production mode
npm start

text

### Method 2: Docker Installation

1. **Clone and navigate:**
git clone https://github.com/Akashkallepalli/library-management-api.git
cd library-management-api

text

2. **Start with Docker Compose:**
docker-compose up -d

text

3. **Check running services:**
docker-compose ps

text

## 📊 Database Schema

### Entity Relationship Diagram
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ Books │◄──────┤ Transactions ├──────►│ Members │
└──────────┘ └──────────────┘ └──────────────┘
│ │ │
│ │ │
▼ ▼ ▼
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ Copies │ │ Fines │ │ Membership │
└──────────┘ └──────────────┘ └──────────────┘

text

### Tables Structure

#### 1. `books` Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| isbn | VARCHAR(13) | Unique ISBN identifier |
| title | VARCHAR | Book title |
| author | VARCHAR | Author name |
| category | ENUM | Book category |
| status | ENUM | 'available', 'borrowed', 'reserved', 'maintenance' |
| total_copies | INTEGER | Total copies owned |
| available_copies | INTEGER | Currently available copies |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### 2. `members` Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Member name |
| email | VARCHAR | Unique email address |
| membership_number | VARCHAR | Unique membership ID |
| status | ENUM | 'active', 'suspended', 'inactive' |
| max_borrow_limit | INTEGER | Maximum books allowed (default: 3) |
| total_fines_paid | DECIMAL | Total fines paid |
| total_fines_owed | DECIMAL | Current unpaid fines |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### 3. `transactions` Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| book_id | UUID | Foreign key to books |
| member_id | UUID | Foreign key to members |
| borrowed_at | TIMESTAMP | Borrowing timestamp |
| due_date | TIMESTAMP | Due date (14 days from borrow) |
| returned_at | TIMESTAMP | Return timestamp (nullable) |
| status | ENUM | 'active', 'returned', 'overdue', 'cancelled' |
| overdue_days | INTEGER | Days overdue |
| calculated_fine | DECIMAL | Calculated fine amount |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

#### 4. `fines` Table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| member_id | UUID | Foreign key to members |
| transaction_id | UUID | Foreign key to transactions |
| amount | DECIMAL | Fine amount |
| reason | VARCHAR | Fine reason description |
| paid_at | TIMESTAMP | Payment timestamp (nullable) |
| status | ENUM | 'pending', 'paid', 'cancelled' |
| due_date | TIMESTAMP | Fine payment due date |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## 🔧 API Endpoints

**Base URL:** `http://localhost:3000/api`

### Books Management

#### 1. Create a New Book
POST /books

text
**Request:**
{
"isbn": "9780132350884",
"title": "Clean Code",
"author": "Robert C. Martin",
"category": "Technology",
"total_copies": 5,
"published_year": 2008,
"publisher": "Prentice Hall"
}

text
**Response (201 Created):**
{
"success": true,
"data": {
"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"isbn": "9780132350884",
"title": "Clean Code",
"author": "Robert C. Martin",
"category": "Technology",
"status": "available",
"total_copies": 5,
"available_copies": 5,
"createdAt": "2024-01-15T10:30:00.000Z",
"updatedAt": "2024-01-15T10:30:00.000Z"
}
}

text

#### 2. Get All Books
GET /books

text
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `title` (optional): Filter by title
- `author` (optional): Filter by author
- `category` (optional): Filter by category
- `status` (optional): Filter by status

**Response (200 OK):**
{
"success": true,
"books": [...],
"pagination": {
"total": 150,
"page": 1,
"limit": 10,
"pages": 15
}
}

text

#### 3. Get Available Books
GET /books/available

text
**Response (200 OK):**
{
"success": true,
"books": [
{
"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"title": "Clean Code",
"author": "Robert C. Martin",
"available_copies": 3,
"status": "available"
}
],
"pagination": {...}
}

text

#### 4. Get Book by ID
GET /books/{id}

text
**Response (200 OK):**
{
"success": true,
"data": {
"id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"isbn": "9780132350884",
"title": "Clean Code",
"author": "Robert C. Martin",
"category": "Technology",
"status": "available",
"total_copies": 5,
"available_copies": 3,
"transactions": [...]
}
}

text

#### 5. Update Book
PUT /books/{id}

text
**Request:**
{
"title": "Clean Code: A Handbook of Agile Software Craftsmanship",
"available_copies": 4
}

text

#### 6. Delete Book
DELETE /books/{id}

text
**Response (200 OK):**
{
"success": true,
"message": "Book deleted successfully"
}

text

#### 7. Search Books
GET /books/search?q={query}

text

### Members Management

#### 1. Create a New Member
POST /members

text
**Request:**
{
"name": "John Doe",
"email": "john.doe@example.com",
"membership_number": "MEM2024001",
"phone": "+1234567890",
"address": "123 Main St, City, Country",
"max_borrow_limit": 3
}

text

#### 2. Get All Members
GET /members

text
**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `name` (optional): Filter by name
- `email` (optional): Filter by email
- `status` (optional): Filter by status

#### 3. Get Member by ID
GET /members/{id}

text
**Response (200 OK):**
{
"success": true,
"data": {
"id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
"name": "John Doe",
"email": "john.doe@example.com",
"membership_number": "MEM2024001",
"status": "active",
"current_borrow_count": 2,
"total_unpaid_fines": 0,
"transactions": [...],
"fines": [...]
}
}

text

#### 4. Get Borrowed Books by Member
GET /members/{id}/borrowed

text
**Response (200 OK):**
{
"success": true,
"member": {
"id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
"name": "John Doe",
"email": "john.doe@example.com"
},
"borrowed_books": [
{
"id": "t1x2y3z4-5678-90ab-cdef-1234567890ab",
"book": {
"title": "Clean Code",
"author": "Robert C. Martin"
},
"borrowed_at": "2024-01-10T09:00:00.000Z",
"due_date": "2024-01-24T09:00:00.000Z",
"is_overdue": false,
"overdue_days": 0
}
],
"total_borrowed": 2
}

text

#### 5. Update Member
PUT /members/{id}

text

#### 6. Delete Member
DELETE /members/{id}

text

### Transactions Management

#### 1. Borrow a Book
POST /transactions/borrow

text
**Request:**
{
"book_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"member_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
"notes": "For personal reading"
}

text
**Response (201 Created):**
{
"success": true,
"transaction": {
"id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
"book_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
"member_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
"borrowed_at": "2024-01-15T10:30:00.000Z",
"due_date": "2024-01-29T10:30:00.000Z",
"status": "active"
},
"message": "Book borrowed successfully",
"due_date": "2024-01-29T10:30:00.000Z",
"return_by": "January 29th 2024"
}

text

#### 2. Return a Book
POST /transactions/{id}/return

text
**Request:**
{
"condition": "good",
"notes": "Book returned in good condition"
}

text
**Response (200 OK):**
{
"success": true,
"transaction": {...},
"fine": {
"id": "f1n2e3i4-d567-890a-bcde-f67890123456",
"amount": 2.50,
"reason": "Overdue fine for 5 day(s)"
},
"message": "Book returned successfully",
"overdue_days": 5,
"fine_amount": 2.50
}

text

#### 3. Get Overdue Transactions
GET /transactions/overdue

text
**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200 OK):**
{
"success": true,
"transactions": [
{
"id": "t1x2y3z4-5678-90ab-cdef-1234567890ab",
"book": {
"title": "Clean Code",
"author": "Robert C. Martin"
},
"member": {
"name": "John Doe",
"email": "john.doe@example.com"
},
"due_date": "2024-01-24T09:00:00.000Z",
"overdue_days": 6,
"calculated_fine": 3.00,
"has_unpaid_fine": true
}
],
"total_overdue_fines": 15.50,
"total_overdue_books": 8,
"pagination": {...}
}

text

#### 4. Renew a Book
POST /transactions/{id}/renew

text
**Request:**
{
"extension_days": 7
}

text

#### 5. Get Transaction by ID
GET /transactions/{id}

text

#### 6. Get All Transactions
GET /transactions

text

### Fines Management

#### 1. Pay a Fine
POST /fines/{id}/pay

text
**Request:**
{
"payment_method": "card",
"amount_paid": 5.00,
"transaction_reference": "TXN123456789"
}

text
**Response (200 OK):**
{
"success": true,
"fine": {
"id": "f1n2e3i4-d567-890a-bcde-f67890123456",
"amount": 2.50,
"status": "paid",
"paid_at": "2024-01-15T11:00:00.000Z"
},
"message": "Fine paid successfully",
"change": 2.50,
"member_status": "active"
}

text

#### 2. Get All Fines
GET /fines

text

#### 3. Get Fine by ID
GET /fines/{id}

text

#### 4. Get Member Fines
GET /fines/member/{member_id}

text

#### 5. Generate Fine Report
GET /fines/report?start_date=2024-01-01&end_date=2024-01-31

text

#### 6. Waive a Fine (Admin)
POST /fines/{id}/waive

text
**Request:**
{
"reason": "First-time offense waiver"
}

text

## 🎯 State Machine Implementation

### Book State Machine
// State transitions for books
const bookStates = {
available: ['borrowed', 'reserved', 'maintenance'],
borrowed: ['available', 'overdue', 'maintenance'],
reserved: ['available', 'borrowed'],
maintenance: ['available'],
overdue: ['available', 'maintenance']
};

// Valid transitions:
// available → borrowed (when book is checked out)
// available → reserved (when book is put on hold)
// available → maintenance (when book needs repair)
// borrowed → available (when book is returned on time)
// borrowed → overdue (when book is past due date)
// borrowed → maintenance (if damaged during loan)
// overdue → available (when returned with fine)
// reserved → available (when reservation expires)
// reserved → borrowed (when reserved book is checked out)
// maintenance → available (when repairs completed)

text

### Member State Machine
// State transitions for members
const memberStates = {
active: ['suspended', 'inactive'],
suspended: ['active'],
inactive: ['active']
};

// Valid transitions:
// active → suspended (automatically for 3+ overdue books)
// active → inactive (manually by admin)
// suspended → active (when fines paid or overdue resolved)
// inactive → active (when reactivated by admin)

text

### Transaction State Machine
// State transitions for transactions
const transactionStates = {
active: ['returned', 'overdue', 'cancelled'],
returned: [],
overdue: ['returned', 'cancelled'],
cancelled: []
};

// Valid transitions:
// active → returned (when book returned on time)
// active → overdue (when past due date)
// active → cancelled (if borrowing cancelled)
// overdue → returned (when book returned late)
// overdue → cancelled (if waived by admin)

text

## ⚙️ Business Rule Enforcement

1. **Borrowing Limit Enforcement**
   - Rule: Members cannot borrow more than 3 books simultaneously
   - Implementation: Check active transaction count before allowing new borrow
   - Error: Returns HTTP 403 with message "Borrowing limit reached"

2. **Loan Period Calculation**
   - Rule: Standard loan period is 14 days from borrowing date
   - Implementation: Automatically set `due_date = borrowed_at + 14 days`
   - Extension: Books can be renewed once for additional 7 days

3. **Overdue Fine Calculation**
   - Rule: $0.50 per day for each overdue day
   - Implementation:
     ```
     overdue_days = Math.ceil((returned_at - due_date) / (1000 * 60 * 60 * 24));
     fine_amount = overdue_days * 0.50;
     ```
   - Auto-calculation: Daily cron job calculates fines for overdue books

4. **Fine Payment Block**
   - Rule: Members with unpaid fines cannot borrow new books
   - Implementation: Check `total_fines_owed > 0` before allowing borrow
   - Error: Returns HTTP 403 with message "Member has unpaid fines"

5. **Automatic Suspension**
   - Rule: Members with 3 or more concurrently overdue books are suspended
   - Implementation:
     - Check overdue count on each return/borrow operation
     - Auto-update member status to 'suspended' when threshold met
     - Auto-reactivate when overdue count drops below 3

6. **Book Availability Check**
   - Rule: Books with status 'borrowed' cannot be borrowed again
   - Implementation: Verify `book.status === 'available' && book.available_copies > 0`
   - Error: Returns HTTP 409 with message "Book is not available"

## 🧪 Testing

### Run All Tests
npm test

text

### Run Specific Test Suites
Test books endpoints
npm test -- --testPathPattern=book

Test members endpoints
npm test -- --testPathPattern=member

Test transactions endpoints
npm test -- --testPathPattern=transaction

Test fines endpoints
npm test -- --testPathPattern=fine

text

### Test Coverage Report
npm test -- --coverage

text

### Manual Testing with Postman
- Import the provided `postman_collection.json` into Postman
- Set environment variable `base_url` to `http://localhost:3000`
- Run through the test collection

### Sample Test Cases
// Example test for borrowing rules
describe('Borrowing Rules', () => {
it('should prevent borrowing more than 3 books', async () => {
// Test implementation
});

it('should block borrowing with unpaid fines', async () => {
// Test implementation
});

it('should auto-suspend member with 3+ overdue books', async () => {
// Test implementation
});
});

text

## 📁 Project Structure
library-management-api/
├── src/
│ ├── config/ # Database and app configuration
│ │ └── database.js # Sequelize configuration
│ ├── models/ # Database models
│ │ ├── index.js # Model associations
│ │ ├── Book.js # Book model
│ │ ├── Member.js # Member model
│ │ ├── Transaction.js # Transaction model
│ │ └── Fine.js # Fine model
│ ├── controllers/ # Request handlers
│ │ ├── bookController.js
│ │ ├── memberController.js
│ │ ├── transactionController.js
│ │ └── fineController.js
│ ├── services/ # Business logic layer
│ │ ├── bookService.js
│ │ ├── memberService.js
│ │ ├── transactionService.js
│ │ └── fineService.js
│ ├── routes/ # API routes
│ │ ├── books.js
│ │ ├── members.js
│ │ ├── transactions.js
│ │ └── fines.js
│ ├── middleware/ # Custom middleware
│ │ ├── errorHandler.js
│ │ └── validation.js
│ ├── utils/ # Utilities
│ │ ├── stateMachine.js
│ │ ├── dateUtils.js
│ │ └── constants.js
│ └── app.js # Main application setup
├── tests/ # Test files
├── .env # Environment variables
├── .env.example # Environment template
├── .gitignore
├── package.json
├── README.md # This file
├── postman_collection.json # Postman collection
├── server.js # Server entry point
├── Dockerfile # Docker configuration
└── docker-compose.yml # Docker Compose setup

text

## 🔒 Security Features

1. **Input Validation**
   - All incoming data validated with Joi schemas
   - Prevents SQL injection and XSS attacks
   - Returns detailed validation errors

2. **Database Security**
   - Uses Sequelize ORM with parameterized queries
   - Implements proper foreign key constraints
   - Enforces data integrity at database level

3. **API Protection**
   - Rate limiting (100 requests/15 minutes per IP)
   - CORS configuration
   - Security headers with Helmet.js
   - Request size limiting

4. **Error Handling**
   - Centralized error handling middleware
   - No sensitive data in error responses
   - Proper HTTP status codes for different error types

## 📈 Performance Optimizations

1. **Database Optimization**
   - Proper indexing on frequently queried fields
   - Connection pooling with Sequelize
   - Efficient query design with eager loading

2. **API Performance**
   - Pagination on all list endpoints
   - Selective field projection
   - Caching layer (Redis - to be implemented)

3. **Memory Management**
   - Request/response size limits
   - Proper connection cleanup
   - Graceful shutdown handling

## 🚀 Deployment

### Option 1: Traditional Deployment

1. **Build the application:**
npm run build

text

2. **Set production environment:**
export NODE_ENV=production

text

3. **Start with PM2:**
npm install -g pm2
pm2 start server.js --name library-api
pm2 save
pm2 startup

text

### Option 2: Docker Deployment

1. **Build and run with Docker Compose:**
docker-compose up --build -d

text

2. **Check logs:**
docker-compose logs -f api

text

3. **Stop services:**
docker-compose down

text

### Option 3: Cloud Deployment (Heroku)

1. **Create Heroku app:**
heroku create library-management-api

text

2. **Add PostgreSQL addon:**
heroku addons:create heroku-postgresql:hobby-dev

text

3. **Deploy application:**
git push heroku main

text

4. **Run migrations:**
heroku run npm run migrate

text

## 📊 Monitoring & Maintenance

### Health Check Endpoint
GET /health

text
**Response:**
{
"status": "healthy",
"timestamp": "2024-01-15T10:30:00.000Z",
"uptime": 12345.67,
"database": "connected",
"memory": {
"used": "45%",
"total": "1024 MB"
}
}

text

### Logging

- Development: Console logging with request details
- Production: Structured JSON logging to files
- Error tracking: Centralized error logging with stack traces

### Cron Jobs

- Daily fine calculation: Runs at midnight to update overdue fines
- Auto-suspension check: Checks members for suspension criteria
- Report generation: Weekly/Monthly reports

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **Database Connection Errors**
Check PostgreSQL is running
sudo service postgresql status

Check connection parameters in .env
Verify database exists
psql -U postgres -c "\l"

Reset database (development only)
npm run db:reset

text

2. **Port Already in Use**
Find process using port 3000
lsof -i :3000

Kill the process
kill -9 <PID>

Or use different port
PORT=3001 npm start

text

3. **Migration Errors**
Reset database
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate

Check migration files
ls src/migrations/

text

4. **Docker Issues**
Check Docker is running
docker info

Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

Check logs
docker-compose logs api

text

## 🔄 API Versioning

The API follows semantic versioning. Current version: v1.0.0

### Version Headers
Request with version header
curl -H "Accept: application/vnd.library.v1+json"
http://localhost:3000/api/books

text

## 🤝 Contributing

- Fork the repository
- Create a feature branch:
git checkout -b feature/amazing-feature

text
- Commit your changes:
git commit -m 'Add amazing feature'

text
- Push to the branch:
git push origin feature/amazing-feature

text
- Open a Pull Request

### Code Style

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](https://license/) file for details.

## 📞 Support

For support, please:
- Check the [Troubleshooting] section
- Search existing [GitHub Issues](https://github.com/Akashkallepalli/library-management-api/issues)
- Create a new issue with detailed description

### Contact

- Email: [your-email@example.com](mailto:your-email@example.com)
- GitHub Issues: [Create New Issue](https://github.com/Akashkallepalli/library-management-api/issues/new)

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- Sequelize team for the ORM
- PostgreSQL community
- All contributors and testers

## 📚 Additional Resources

### Documentation

- [API Documentation](https://docs/api.md)
- [Database Schema](https://docs/schema.md)
- [Deployment Guide](https://docs/deployment.md)

### External Links

- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tools

- [Postman Collection](https://postman_collection.json/)
- [Database Dump](https://scripts/dump.sql)
- [Migration Scripts](https://src/migrations/)