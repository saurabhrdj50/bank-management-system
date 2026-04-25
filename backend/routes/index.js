// API Routes

import express from 'express';
import { 
  register, 
  login,
  getProfile,
  logout, 
  refreshToken, 
  changePassword,
  verifyOTPLogin,
  setup2FA,
  verify2FASetup,
  disable2FA
} from '../controllers/authController.js';
import { 
  getAllCustomers, 
  getCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getCustomerProfile,
  updateProfile,
  verifyKYC 
} from '../controllers/customerController.js';
import {
  createAccount,
  getCustomerAccounts,
  getCustomerAccountsByCustomerId,
  getAccount,
  deposit,
  withdraw,
  transfer,
  closeAccount
} from '../controllers/accountController.js';
import {
  getTransactionHistory,
  getMiniStatement,
  getTransactionAnalytics,
  detectFraud,
  getTransactionById,
  downloadStatement
} from '../controllers/transactionController.js';
import {
  applyLoan,
  getLoansByCustomer,
  getAllLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  disburseLoan,
  payEMI
} from '../controllers/loanController.js';
import {
  getDashboardStats,
  getAllTransactions,
  getAuditLogs,
  getUsers,
  updateUserStatus,
  getCustomerAnalytics,
  getLoanAnalytics,
  getNotifications,
  generateReport
} from '../controllers/adminController.js';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.js';

const router = express.Router();

// ==================== AUTH ROUTES ====================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', verifyToken, getProfile);
router.post('/auth/verify-otp-login', verifyOTPLogin);
router.post('/auth/refresh-token', refreshToken);
router.post('/auth/logout', verifyToken, logout);
router.post('/auth/change-password', verifyToken, changePassword);

// ==================== 2FA ROUTES ====================
router.post('/auth/setup-2fa', verifyToken, setup2FA);
router.post('/auth/verify-2fa-setup', verifyToken, verify2FASetup);
router.post('/auth/disable-2fa', verifyToken, disable2FA);

// ==================== CUSTOMER ROUTES ====================
// Admin: Get all customers
router.get('/customers', verifyToken, isAdmin, getAllCustomers);
// Get customer by ID (Admin only)
router.get('/customers/:id', verifyToken, isAdmin, getCustomer);
// Update customer (Admin)
router.put('/customers/:id', verifyToken, isAdmin, updateCustomer);
// Delete customer (Admin only)
router.delete('/customers/:id', verifyToken, isAdmin, deleteCustomer);
// Get own profile (User)
router.get('/profile', verifyToken, getCustomerProfile);
// Update own profile (User)
router.put('/profile', verifyToken, updateProfile);
// Verify KYC (Admin)
router.post('/customers/:id/verify-kyc', verifyToken, isAdmin, verifyKYC);

// ==================== ACCOUNT ROUTES ====================
// Get logged-in user's accounts
router.get('/accounts', verifyToken, getCustomerAccounts);
// Create new account
router.post('/accounts', verifyToken, createAccount);
// Get customer's accounts
router.get('/customers/:customerId/accounts', verifyToken, getCustomerAccountsByCustomerId);
// Get account details
router.get('/accounts/:accountId', verifyToken, getAccount);
// Deposit money
router.post('/accounts/:accountId/deposit', verifyToken, deposit);
// Withdraw money
router.post('/accounts/:accountId/withdraw', verifyToken, withdraw);
// Transfer money
router.post('/accounts/transfer', verifyToken, transfer);
// Close account
router.post('/accounts/:accountId/close', verifyToken, closeAccount);

// ==================== TRANSACTION ROUTES ====================
// Get transaction history for logged-in user's accounts
router.get('/transactions', verifyToken, getTransactionHistory);
// Get transaction history for a specific account
router.get('/accounts/:accountId/transactions', verifyToken, getTransactionHistory);
// Get mini statement
router.get('/accounts/:accountId/mini-statement', verifyToken, getMiniStatement);
// Get transaction analytics
router.get('/accounts/:accountId/analytics', verifyToken, getTransactionAnalytics);
// Get specific transaction
router.get('/transactions/:transactionId', verifyToken, getTransactionById);
// Detect fraud
router.post('/transactions/:transactionId/fraud-check', verifyToken, isAdmin, detectFraud);
// Download statement
router.get('/accounts/:accountId/statement/download', verifyToken, downloadStatement);

// ==================== LOAN ROUTES ====================
// Apply for loan
router.post('/loans/apply', verifyToken, applyLoan);
// Get loans for customer
router.get('/customers/:customerId/loans', verifyToken, getLoansByCustomer);
// Get loan by ID
router.get('/loans/:loanId', verifyToken, getLoanById);
// Get all loans (Admin)
router.get('/loans', verifyToken, isAdmin, getAllLoans);
// Approve loan (Admin)
router.post('/loans/:loanId/approve', verifyToken, isAdmin, approveLoan);
// Reject loan (Admin)
router.post('/loans/:loanId/reject', verifyToken, isAdmin, rejectLoan);
// Disburse loan (Admin)
router.post('/loans/:loanId/disburse', verifyToken, isAdmin, disburseLoan);
// Pay EMI
router.post('/loans/pay-emi', verifyToken, payEMI);

// ==================== ADMIN ROUTES ====================
// Dashboard statistics
router.get('/admin/dashboard', verifyToken, isAdmin, getDashboardStats);
// Get all transactions (Admin)
router.get('/admin/transactions', verifyToken, isAdmin, getAllTransactions);
// Get audit logs (Admin)
router.get('/admin/audit-logs', verifyToken, isAdmin, getAuditLogs);
// Get users (Admin)
router.get('/admin/users', verifyToken, isAdmin, getUsers);
// Update user status (Admin)
router.put('/admin/users/:userId/status', verifyToken, isAdmin, updateUserStatus);
// Customer analytics (Admin)
router.get('/admin/analytics/customers', verifyToken, isAdmin, getCustomerAnalytics);
// Loan analytics (Admin)
router.get('/admin/analytics/loans', verifyToken, isAdmin, getLoanAnalytics);
// Get all notifications (Admin)
router.get('/admin/notifications', verifyToken, isAdmin, getNotifications);
// Generate report (Admin)
router.get('/admin/reports', verifyToken, isAdmin, generateReport);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

export default router;
