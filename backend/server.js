// Main Server File - Bank Management System

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { generalLimiter, authLimiter, otpLimiter, apiLimiter, transactionLimiter, sanitizeData, securityHeaders, corsConfig, validateRequest, checkIPBlacklist } from './middleware/security.js';

dotenv.config();
const app = express();

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Security Middleware - Apply first for maximum protection
app.use(checkIPBlacklist);
app.use(helmet());
app.use(cors(corsConfig));
app.use(securityHeaders);
app.use(sanitizeData);

// Standard Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter
app.use(generalLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Request Validator
app.use(validateRequest);

// Routes with specific rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/otp', otpLimiter);
app.use('/api/transactions', transactionLimiter);
app.use('/api', apiLimiter);
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date(), uptime: process.uptime() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.path });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Bank Management System - Backend      ║
║   Server running on port ${PORT}         ║
║   Security Middleware: ACTIVE           ║
╚════════════════════════════════════════╝
  `);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
