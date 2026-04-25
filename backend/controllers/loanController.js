// Loan Controller

import { Loan, Customer, Account, Transaction, Notification, AuditLog } from '../models/index.js';
import { calculateEMI } from '../utils/helpers.js';

const logAuditAction = async (userId, action, entityType, entityId, changes, req) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const createNotification = async (customerId, type, title, message) => {
  try {
    await Notification.create({
      customerId,
      type,
      title,
      message,
      read: false
    });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// Helper function to check loan eligibility
const checkLoanEligibility = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer || customer.accountStatus !== 'active') {
    return { eligible: false, reason: 'Customer account not active' };
  }

  // KYC check is now bypassed for demo - always return true
  // if (!customer.kyc.verified) {
  //   return { eligible: false, reason: 'KYC verification required' };
  // }

  const accounts = await Account.find({ customerId, status: 'active' });
  if (accounts.length === 0) {
    return { eligible: false, reason: 'No active accounts' };
  }

  const pastLoans = await Loan.find({ customerId });
  const closedLoans = pastLoans.filter(l => l.status === 'closed');
  
  if (pastLoans.length > 0 && closedLoans.length === 0) {
    return { eligible: false, reason: 'Previous loans pending' };
  }

  return { eligible: true, reason: 'Customer eligible for loan' };
};

export const applyLoan = async (req, res) => {
  try {
    const { customerId, principalAmount, tenure, loanType, accountId } = req.body;
    const userId = req.userId;

    if (!customerId || !principalAmount || !tenure || !loanType) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    if (principalAmount <= 0 || tenure <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount or tenure' });
    }

    const eligibility = await checkLoanEligibility(customerId);
    if (!eligibility.eligible) {
      return res.status(400).json({ success: false, message: eligibility.reason });
    }

    const interestRates = { personal: 8.5, home: 6.5, auto: 7.5, business: 9.5 };
    const interestRate = interestRates[loanType] || 8.5;
    const monthlyEMI = calculateEMI(principalAmount, interestRate, tenure);
    const totalAmount = monthlyEMI * tenure;

    const loan = new Loan({
      customerId,
      accountId,
      principalAmount,
      interestRate,
      tenure,
      loanType,
      monthlyEMI,
      totalAmount,
      status: 'pending',
      applicationDate: new Date()
    });

    await loan.save();
    await logAuditAction(userId, 'APPLY_LOAN', 'Loan', loan._id, { principalAmount, tenure, loanType }, req);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted',
      data: loan
    });
  } catch (error) {
    console.error('Apply loan error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply for loan', error: error.message });
  }
};

export const getLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    const query = { customerId };
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('accountId', 'accountNumber accountType balance')
      .sort({ applicationDate: -1 });

    res.status(200).json({
      message: 'Loans retrieved successfully',
      data: loans
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Failed to retrieve loans', error: error.message });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .populate('accountId', 'accountNumber accountType balance')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ applicationDate: -1 });

    const total = await Loan.countDocuments(query);

    res.status(200).json({
      message: 'All loans retrieved successfully',
      data: loans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({ message: 'Failed to retrieve loans', error: error.message });
  }
};

export const getLoanById = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId)
      .populate('customerId', 'firstName lastName email phone')
      .populate('accountId', 'accountNumber accountType balance');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Calculate remaining EMI and paid amount
    const remainingEMI = Math.max(0, loan.tenure - Math.ceil(loan.amountPaid / loan.monthlyEMI));
    const paidMonths = Math.floor(loan.amountPaid / loan.monthlyEMI);

    res.status(200).json({
      message: 'Loan retrieved successfully',
      data: {
        ...loan.toObject(),
        remainingEMI,
        paidMonths,
        paidPercentage: (loan.amountPaid / loan.totalAmount) * 100
      }
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ message: 'Failed to retrieve loan', error: error.message });
  }
};

export const approveLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.userId;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan can only be approved from pending status' });
    }

    loan.status = 'approved';
    loan.approvalDate = new Date();
    await loan.save();

    await logAuditAction(userId, 'APPROVE_LOAN', 'Loan', loanId, {}, req);

    await createNotification(
      loan.customerId, 
      'loan', 
      'Loan Approved', 
      `Your loan of ₹${loan.principalAmount} has been approved`
    );

    res.status(200).json({
      message: 'Loan approved successfully',
      data: loan
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({ message: 'Failed to approve loan', error: error.message });
  }
};

export const rejectLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan can only be rejected from pending status' });
    }

    loan.status = 'rejected';
    await loan.save();

    await logAuditAction(userId, 'REJECT_LOAN', 'Loan', loanId, { reason }, req);

    await createNotification(
      loan.customerId, 
      'loan', 
      'Loan Rejected', 
      `Your loan application has been rejected. Reason: ${reason || 'See details for more information'}`
    );

    res.status(200).json({
      message: 'Loan rejected successfully',
      data: loan
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({ message: 'Failed to reject loan', error: error.message });
  }
};

export const disburseLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const userId = req.userId;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({ message: 'Loan must be approved before disbursement' });
    }

    const account = await Account.findById(loan.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Create transaction for disbursement
    const balanceBefore = account.balance;
    account.balance += loan.principalAmount;
    await account.save();

    // Update customer total balance
    const customer = await Customer.findById(loan.customerId);
    customer.totalBalance = (customer.totalBalance || 0) + loan.principalAmount;
    await customer.save();

    // Create transaction record
    const referenceNumber = `LOAN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    await Transaction.create({
      fromAccountId: null,
      toAccountId: loan.accountId,
      type: 'loan_disbursement',
      amount: loan.principalAmount,
      balanceBefore,
      balanceAfter: account.balance,
      description: `Loan Disbursement - ${loan.loanType}`,
      status: 'completed',
      referenceNumber
    });

    loan.status = 'disbursed';
    loan.disbursementDate = new Date();
    await loan.save();

    await logAuditAction(userId, 'DISBURSE_LOAN', 'Loan', loanId, { amount: loan.principalAmount }, req);

    await createNotification(
      loan.customerId, 
      'loan', 
      'Loan Disbursed', 
      `₹${loan.principalAmount} has been disbursed to your account. Monthly EMI: ₹${loan.monthlyEMI}`
    );

    res.status(200).json({
      message: 'Loan disbursed successfully',
      data: loan
    });
  } catch (error) {
    console.error('Disburse loan error:', error);
    res.status(500).json({ message: 'Failed to disburse loan', error: error.message });
  }
};

export const payEMI = async (req, res) => {
  try {
    const { loanId, amount } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'disbursed') {
      return res.status(400).json({ message: 'Loan is not in disbursed status' });
    }

    if (loan.amountPaid + amount > loan.totalAmount) {
      return res.status(400).json({ message: 'Payment exceeds total loan amount' });
    }

    const account = await Account.findById(loan.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const emiAmount = parseFloat(amount);
    if (account.balance < emiAmount) {
      return res.status(400).json({ message: 'Insufficient account balance' });
    }

    const balanceBefore = account.balance;
    account.balance -= emiAmount;
    await account.save();

    const customer = await Customer.findById(loan.customerId);
    if (customer) {
      customer.totalBalance = Math.max(0, (customer.totalBalance || 0) - emiAmount);
      await customer.save();
    }

    loan.amountPaid += emiAmount;

    // Check if loan is fully paid
    if (loan.amountPaid >= loan.totalAmount) {
      loan.status = 'closed';
    }

    await loan.save();

    // Create transaction record
    const referenceNumber = `EMI${Date.now()}${Math.floor(Math.random() * 10000)}`;
    await Transaction.create({
      fromAccountId: loan.accountId,
      type: 'emi_payment',
      amount: emiAmount,
      balanceBefore,
      balanceAfter: account.balance,
      description: `EMI Payment - ${loan.loanType} Loan`,
      status: 'completed',
      referenceNumber
    });

    await logAuditAction(userId, 'PAY_EMI', 'Loan', loanId, { amount }, req);

    await createNotification(
      loan.customerId, 
      'loan', 
      'EMI Payment Successful', 
      `₹${amount} EMI payment received. Remaining: ₹${loan.totalAmount - loan.amountPaid}`
    );

    res.status(200).json({
      message: 'EMI payment successful',
      data: loan
    });
  } catch (error) {
    console.error('Pay EMI error:', error);
    res.status(500).json({ message: 'Failed to process EMI payment', error: error.message });
  }
};
