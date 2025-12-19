const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');

// Import routes
const bookRoutes = require('./routes/books');
const memberRoutes = require('./routes/members');
const transactionRoutes = require('./routes/transactions');
const fineRoutes = require('./routes/fines');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.initializeDatabase();
  }

  setupMiddleware() {
    // Security headers
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Request logging
    this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request timing
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // API routes
    this.app.use('/api/books', bookRoutes);
    this.app.use('/api/members', memberRoutes);
    this.app.use('/api/transactions', transactionRoutes);
    this.app.use('/api/fines', fineRoutes);
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        method: req.method
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async initializeDatabase() {
    await testConnection();
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();