// Database Models - Bank Management System

import mongoose from 'mongoose';

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    address: { street: String, city: String, state: String, zipCode: String, country: String },
    dateOfBirth: Date,
    aadharNumber: { type: String, unique: true, sparse: true },
    panNumber: { type: String, unique: true, sparse: true },
    accountStatus: { type: String, enum: ['active', 'inactive', 'frozen'], default: 'active' },
    kyc: { verified: { type: Boolean, default: false }, verificationDate: Date },
    totalBalance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Account Schema
const accountSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    accountNumber: { type: String, unique: true, required: true },
    accountType: { type: String, enum: ['savings', 'current', 'fixed_deposit'], default: 'savings' },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    interestRate: { type: Number, default: 3.5 },
    status: { type: String, enum: ['active', 'inactive', 'frozen', 'closed'], default: 'active' },
    minimumBalance: { type: Number, default: 1000 },
    lastInterestCreditDate: Date,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required() {
        return this.type !== 'loan_disbursement';
      }
    },
    toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'interest_credit', 'loan_disbursement', 'emi_payment'],
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: Number,
    balanceAfter: Number,
    description: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    referenceNumber: { type: String, unique: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Loan Schema
const loanSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, default: 8.5 },
    tenure: { type: Number, required: true },
    loanType: { type: String, enum: ['personal', 'home', 'auto', 'business'], default: 'personal' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'disbursed', 'closed'], default: 'pending' },
    monthlyEMI: Number,
    totalAmount: Number,
    amountPaid: { type: Number, default: 0 },
    applicationDate: { type: Date, default: Date.now },
    approvalDate: Date,
    disbursementDate: Date,
  },
  { timestamps: true }
);

// Notification Schema
const notificationSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, enum: ['transaction', 'loan', 'alert', 'offer'], required: true },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Audit Log Schema
const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    changes: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    // OTP Fields
    otp: { type: String },
    otpExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    // 2FA Fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    twoFactorVerified: { type: Boolean, default: false },
    twoFactorBackupCodes: [String],
    // Device tracking for 2FA
    trustedDevices: [
      {
        deviceId: String,
        deviceName: String,
        lastUsed: Date,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
export const Account = mongoose.model('Account', accountSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Loan = mongoose.model('Loan', loanSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const User = mongoose.model('User', userSchema);
