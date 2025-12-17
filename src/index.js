const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandlerMiddleware } = require('./middleware/errorHandler');

// Import models to register associations
const Book = require('./models/Book');
const Member = require('./models/Member');
const Transaction = require('./models/Transaction');
const Fine = require('./models/Fine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use(`/api/${process.env.API_VERSION}`, apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use(errorHandlerMiddleware);

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    await sequelize.sync();
    console.log('Database synchronized');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;