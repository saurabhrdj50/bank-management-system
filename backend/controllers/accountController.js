// Account Controller

import { Account, Customer, Transaction, Notification, AuditLog } from '../models/index.js';
import { generateAccountNumber, calculateEMI } from '../utils/helpers.js';

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

export const createAccount = async (req, res) => {
  try {
    const { customerId, accountType } = req.body;
    const userId = req.userId;

    // Validation
    if (!customerId || !accountType) {
      return res.status(400).json({ message: 'Customer ID and account type are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if account type already exists
    const existingAccount = await Account.findOne({ customerId, accountType, status: { $ne: 'closed' } });
    if (existingAccount) {
      return res.status(400).json({ message: `${accountType} account already exists` });
    }

    // Create account
    const account = new Account({
      customerId,
      accountNumber: generateAccountNumber(),
      accountType,
      balance: 0,
      status: 'active',
      interestRate: accountType === 'fixed_deposit' ? 6.5 : 3.5
    });
    await account.save();

    await logAuditAction(userId, 'CREATE_ACCOUNT', 'Account', account._id, { accountType }, req);
    await createNotification(customerId, 'transaction', 'Account Created', `Your ${accountType} account has been created successfully`);

    res.status(201).json({
      message: 'Account created successfully',
      data: account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Failed to create account', error: error.message });
  }
};

export const getCustomerAccounts = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's customer ID
    const { User } = await import('../models/index.js');
    const user = await User.findById(userId);
    
    if (!user?.customerId) {
      return res.status(200).json({ 
        success: true, 
        message: 'No accounts found', 
        data: [] 
      });
    }

    const accounts = await Account.find({ customerId: user.customerId });

    res.status(200).json({
      success: true,
      message: 'Accounts retrieved',
      data: accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve accounts', error: error.message });
  }
};

export const getCustomerAccountsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const accounts = await Account.find({ customerId });

    res.status(200).json({
      success: true,
      message: 'Accounts retrieved',
      data: accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve accounts', error: error.message });
  }
};

export const getAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.status(200).json({
      message: 'Account retrieved successfully',
      data: account
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Failed to retrieve account', error: error.message });
  }
};

export const deposit = async (req, res) => {
  try {
    const accountId = req.params.accountId || req.body.accountId;
    const { amount } = req.body;
    const userId = req.userId;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account and amount required' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Account not active' });
    }

    const balanceBefore = account.balance;
    account.balance += parseFloat(amount);
    await account.save();

    const customer = await Customer.findById(account.customerId);
    if (customer) {
      customer.totalBalance = (customer.totalBalance || 0) + parseFloat(amount);
      await customer.save();
    }

    const referenceNumber = `DEP${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const transaction = new Transaction({
      fromAccountId: accountId,
      type: 'deposit',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: account.balance,
      description: 'Deposit',
      status: 'completed',
      referenceNumber
    });
    await transaction.save();

    await logAuditAction(userId, 'DEPOSIT', 'Account', accountId, { amount, referenceNumber }, req);

    res.status(200).json({
      success: true,
      message: 'Deposit successful',
      data: { account, transaction }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, message: 'Deposit failed', error: error.message });
  }
};

export const withdraw = async (req, res) => {
  try {
    const accountId = req.params.accountId || req.body.accountId;
    const { amount } = req.body;
    const userId = req.userId;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account and amount required' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Account not active' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const balanceBefore = account.balance;
    account.balance -= parseFloat(amount);
    await account.save();

    const customer = await Customer.findById(account.customerId);
    if (customer) {
      customer.totalBalance = (customer.totalBalance || 0) - parseFloat(amount);
      await customer.save();
    }

    const referenceNumber = `WIT${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const transaction = new Transaction({
      fromAccountId: accountId,
      type: 'withdrawal',
      amount: parseFloat(amount),
      balanceBefore,
      balanceAfter: account.balance,
      description: 'Withdrawal',
      status: 'completed',
      referenceNumber
    });
    await transaction.save();

    await logAuditAction(userId, 'WITHDRAWAL', 'Account', accountId, { amount, referenceNumber }, req);

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      data: { account, transaction }
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, message: 'Withdrawal failed', error: error.message });
  }
};

export const transfer = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;
    const userId = req.userId;

    // Validation
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'All fields are required and amount must be positive' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }

    const fromAccount = await Account.findById(fromAccountId);
    if (!fromAccount) {
      return res.status(404).json({ message: 'Sender account not found' });
    }

    const toAccount = await Account.findById(toAccountId);
    if (!toAccount) {
      return res.status(404).json({ message: 'Receiver account not found' });
    }

    if (fromAccount.status !== 'active') {
      return res.status(400).json({ message: 'Sender account is not active' });
    }

    if (toAccount.status !== 'active') {
      return res.status(400).json({ message: 'Receiver account is not active' });
    }

    // Check balance
    if (fromAccount.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check minimum balance for sender's savings account
    if (fromAccount.accountType === 'savings' && (fromAccount.balance - amount) < fromAccount.minimumBalance) {
      return res.status(400).json({ 
        message: `Transfer not allowed. Minimum balance of ₹${fromAccount.minimumBalance} must be maintained` 
      });
    }

    // Record balances before transaction
    const fromBalanceBefore = fromAccount.balance;
    const toBalanceBefore = toAccount.balance;

    // Update balances
    fromAccount.balance -= parseFloat(amount);
    toAccount.balance += parseFloat(amount);
    await fromAccount.save();
    await toAccount.save();

    // Update customer balances
    const fromCustomer = await Customer.findById(fromAccount.customerId);
    fromCustomer.totalBalance = (fromCustomer.totalBalance || 0) - parseFloat(amount);
    await fromCustomer.save();

    const toCustomer = await Customer.findById(toAccount.customerId);
    toCustomer.totalBalance = (toCustomer.totalBalance || 0) + parseFloat(amount);
    await toCustomer.save();

    // Create transaction record
    const referenceNumber = `TRN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const transaction = new Transaction({
      fromAccountId,
      toAccountId,
      type: 'transfer',
      amount: parseFloat(amount),
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromAccount.balance,
      description: description || `Transfer to ${toAccount.accountNumber}`,
      status: 'completed',
      referenceNumber
    });
    await transaction.save();

    await logAuditAction(userId, 'TRANSFER', 'Account', fromAccountId, { 
      toAccountId, 
      amount, 
      referenceNumber 
    }, req);

    await createNotification(
      fromAccount.customerId, 
      'transaction', 
      'Transfer Successful', 
      `₹${amount} transferred to ${toAccount.accountNumber}`
    );
    await createNotification(
      toAccount.customerId, 
      'transaction', 
      'Transfer Received', 
      `₹${amount} received from ${fromAccount.accountNumber}`
    );

    res.status(200).json({
      message: 'Transfer successful',
      data: {
        transaction,
        fromAccount,
        toAccount
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Transfer failed', error: error.message });
  }
};

export const closeAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.userId;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.balance > 0) {
      return res.status(400).json({ message: 'Account balance must be zero before closing' });
    }

    account.status = 'closed';
    await account.save();

    await logAuditAction(userId, 'CLOSE_ACCOUNT', 'Account', accountId, {}, req);
    await createNotification(account.customerId, 'alert', 'Account Closed', 'Your account has been closed');

    res.status(200).json({
      message: 'Account closed successfully',
      data: account
    });
  } catch (error) {
    console.error('Close account error:', error);
    res.status(500).json({ message: 'Failed to close account', error: error.message });
  }
};
