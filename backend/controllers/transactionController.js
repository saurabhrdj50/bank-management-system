// Transaction Controller

import { Transaction, Account, Notification, AuditLog } from '../models/index.js';

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

// Fraud detection algorithm
const detectFraudPattern = async (transaction) => {
  const fraudScores = [];

  // 1. Check unusual amount (higher than average for this account)
  const accountTransactions = await Transaction.find({ 
    fromAccountId: transaction.fromAccountId,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  if (accountTransactions.length > 0) {
    const avgAmount = accountTransactions.reduce((sum, t) => sum + t.amount, 0) / accountTransactions.length;
    if (transaction.amount > avgAmount * 3) {
      fraudScores.push({ reason: 'Unusual transaction amount', score: 30 });
    }
  }

  // 2. Check multiple transactions in short time (velocity check)
  const recentTransactions = await Transaction.find({
    fromAccountId: transaction.fromAccountId,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });

  if (recentTransactions.length > 5) {
    fraudScores.push({ reason: 'High transaction velocity', score: 35 });
  }

  // 3. Check for late-night transactions
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    fraudScores.push({ reason: 'Unusual transaction time', score: 20 });
  }

  // 4. Check for round amounts (potential fraud indicator)
  if (transaction.amount % 100 === 0 && transaction.amount % 1000 === 0) {
    fraudScores.push({ reason: 'Round amount pattern detected', score: 15 });
  }

  const totalScore = fraudScores.reduce((sum, f) => sum + f.score, 0);
  return {
    isSuspicious: totalScore > 50,
    fraudScore: Math.min(totalScore, 100),
    reasons: fraudScores,
    timestamp: new Date()
  };
};

export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { accountId: queryAccountId, page = 1, limit = 10, type, startDate, endDate } = req.query;
    const accountId = req.params.accountId || queryAccountId;

    // If no accountId provided, get all transactions for user's accounts
    let accountIds = [];
    if (accountId) {
      accountIds = [accountId];
    } else {
      // Get user's customer
      const { User, Customer } = await import('../models/index.js');
      const user = await User.findById(userId);
      if (user?.customerId) {
        const accounts = await Account.find({ customerId: user.customerId });
        accountIds = accounts.map(a => a._id);
      }
    }

    if (accountIds.length === 0) {
      return res.status(200).json({ success: true, message: 'No accounts found', data: [], pagination: { total: 0, page: 1, limit, pages: 0 } });
    }

    const skip = (page - 1) * limit;
    const query = {
      $or: [
        { fromAccountId: { $in: accountIds } },
        { toAccountId: { $in: accountIds } }
      ]
    };

    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('fromAccountId', 'accountNumber accountType')
      .populate('toAccountId', 'accountNumber accountType')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved',
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve transactions', error: error.message });
  }
};

export const getMiniStatement = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 5 } = req.query;

    const transactions = await Transaction.find({
      $or: [{ fromAccountId: accountId }, { toAccountId: accountId }]
    })
      .populate('fromAccountId', 'accountNumber accountType')
      .populate('toAccountId', 'accountNumber accountType')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const account = await Account.findById(accountId);

    res.status(200).json({
      message: 'Mini statement retrieved successfully',
      data: {
        account: {
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          balance: account.balance
        },
        transactions
      }
    });
  } catch (error) {
    console.error('Get mini statement error:', error);
    res.status(500).json({ message: 'Failed to retrieve mini statement', error: error.message });
  }
};

export const getTransactionAnalytics = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await Transaction.find({
      $or: [{ fromAccountId: accountId }, { toAccountId: accountId }],
      createdAt: { $gte: startDate }
    });

    // Calculate metrics
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdrawal');
    const transfers = transactions.filter(t => t.type === 'transfer');

    const totalDeposits = deposits.reduce((sum, t) => sum + t.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + t.amount, 0);
    const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0);

    // Group by date
    const dailyData = {};
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { deposits: 0, withdrawals: 0, transfers: 0, count: 0 };
      }
      if (t.type === 'deposit') dailyData[date].deposits += t.amount;
      else if (t.type === 'withdrawal') dailyData[date].withdrawals += t.amount;
      else if (t.type === 'transfer') dailyData[date].transfers += t.amount;
      dailyData[date].count++;
    });

    res.status(200).json({
      message: 'Transaction analytics retrieved successfully',
      data: {
        summary: {
          totalTransactions: transactions.length,
          totalDeposits,
          totalWithdrawals,
          totalTransfers,
          averageTransaction: transactions.length > 0 ? 
            (totalDeposits + totalWithdrawals + totalTransfers) / transactions.length : 0,
          depositCount: deposits.length,
          withdrawalCount: withdrawals.length,
          transferCount: transfers.length
        },
        dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
        period: { days, startDate }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve analytics', error: error.message });
  }
};

export const detectFraud = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.userId;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const fraudAnalysis = await detectFraudPattern(transaction);

    if (fraudAnalysis.isSuspicious) {
      transaction.status = 'pending';
      await transaction.save();

      const account = await Account.findById(transaction.fromAccountId);
      await createNotification(
        account.customerId,
        'alert',
        'Suspicious Activity Detected',
        `Transaction of ₹${transaction.amount} requires verification`
      );

      await logAuditAction(userId, 'FRAUD_ALERT', 'Transaction', transactionId, fraudAnalysis, req);
    }

    res.status(200).json({
      message: 'Fraud analysis completed',
      data: fraudAnalysis
    });
  } catch (error) {
    console.error('Fraud detection error:', error);
    res.status(500).json({ message: 'Fraud detection failed', error: error.message });
  }
};

export const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('fromAccountId', 'accountNumber accountType customerId')
      .populate('toAccountId', 'accountNumber accountType customerId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      message: 'Transaction retrieved successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Failed to retrieve transaction', error: error.message });
  }
};

export const downloadStatement = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      $or: [{ fromAccountId: accountId }, { toAccountId: accountId }]
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('fromAccountId', 'accountNumber accountType')
      .populate('toAccountId', 'accountNumber accountType')
      .sort({ createdAt: -1 });

    const account = await Account.findById(accountId);

    // CSV format
    let csv = 'Date,Description,Type,Amount,Balance Before,Balance After,Status\n';
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toLocaleDateString();
      csv += `"${date}","${t.description}","${t.type}","${t.amount}","${t.balanceBefore}","${t.balanceAfter}","${t.status}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="statement_${accountId}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Download statement error:', error);
    res.status(500).json({ message: 'Failed to download statement', error: error.message });
  }
};

// Helper function for notifications
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
