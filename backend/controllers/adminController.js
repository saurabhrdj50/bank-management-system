// Admin Controller

import { User, Customer, Account, Transaction, Loan, Notification, AuditLog } from '../models/index.js';

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

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalAccounts = await Account.countDocuments();
    const totalLoans = await Loan.countDocuments();

    // Get active counts
    const activeUsers = await User.countDocuments({ status: 'active' });
    const activeAccounts = await Account.countDocuments({ status: 'active' });
    const approvedLoans = await Loan.countDocuments({ status: 'approved' });

    // Get financial metrics
    const accounts = await Account.find({ status: 'active' });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalDeposits = await Transaction.countDocuments({ type: 'deposit' });
    const totalWithdrawals = await Transaction.countDocuments({ type: 'withdrawal' });

    // Get transaction volume
    const transactions = await Transaction.find();
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgTransactionAmount = transactions.length > 0 ? totalTransactionAmount / transactions.length : 0;

    // Loans metrics
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const disbursedLoans = await Loan.countDocuments({ status: 'disbursed' });
    const rejectedLoans = await Loan.countDocuments({ status: 'rejected' });

    const loans = await Loan.find({ status: 'disbursed' });
    const totalLoansDisbursed = loans.reduce((sum, l) => sum + l.principalAmount, 0);

    // Recent activity
    const recentTransactions = await Transaction.find()
      .populate('fromAccountId', 'accountNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentLoans = await Loan.find()
      .populate('customerId', 'firstName lastName')
      .sort({ applicationDate: -1 })
      .limit(5);

    // Top customers by balance
    const topCustomers = await Customer.find()
      .sort({ totalBalance: -1 })
      .limit(5);

    res.status(200).json({
      message: 'Dashboard statistics retrieved successfully',
      data: {
        summary: {
          totalUsers,
          activeUsers,
          totalCustomers,
          totalAccounts,
          activeAccounts,
          totalLoans,
          approvedLoans,
          pendingLoans,
          disbursedLoans,
          rejectedLoans
        },
        financials: {
          totalBalance,
          totalDeposits,
          totalWithdrawals,
          totalTransactionAmount,
          avgTransactionAmount: Math.round(avgTransactionAmount),
          totalLoansDisbursed
        },
        recentActivity: {
          recentTransactions,
          recentLoans,
          topCustomers
        },
        timestamp: new Date()
      }
    });

    await logAuditAction(userId, 'VIEW_DASHBOARD', 'Dashboard', null, {}, req);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard stats', error: error.message });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('fromAccountId', 'accountNumber accountType customerId')
      .populate('toAccountId', 'accountNumber accountType customerId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      message: 'All transactions retrieved successfully',
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Failed to retrieve transactions', error: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, entityType, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      message: 'Audit logs retrieved successfully',
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to retrieve audit logs', error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .populate('customerId', 'firstName lastName email phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.userId;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    await logAuditAction(adminId, 'UPDATE_USER_STATUS', 'User', userId, { status }, req);

    res.status(200).json({
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
};

export const getCustomerAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const newCustomers = await Customer.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    const newAccounts = await Account.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    const newTransactions = await Transaction.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    const newLoans = await Loan.countDocuments({ 
      applicationDate: { $gte: startDate } 
    });

    // Group by date
    const dailyData = {};
    const transactions = await Transaction.find({ createdAt: { $gte: startDate } });
    
    transactions.forEach(t => {
      const date = new Date(t.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, amount: 0 };
      }
      dailyData[date].count++;
      dailyData[date].amount += t.amount;
    });

    res.status(200).json({
      message: 'Customer analytics retrieved successfully',
      data: {
        newCustomers,
        newAccounts,
        newTransactions,
        newLoans,
        dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
        period: { days, startDate }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve analytics', error: error.message });
  }
};

export const getLoanAnalytics = async (req, res) => {
  try {
    const loans = await Loan.find();

    const byLoanType = {};
    const byStatus = {};

    loans.forEach(loan => {
      // Count by type
      byLoanType[loan.loanType] = (byLoanType[loan.loanType] || 0) + 1;
      
      // Count by status
      byStatus[loan.status] = (byStatus[loan.status] || 0) + 1;
    });

    // Calculate totals
    const disbursedLoans = loans.filter(l => l.status === 'disbursed');
    const totalDisbursed = disbursedLoans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalAMT = disbursedLoans.reduce((sum, l) => sum + l.amountPaid, 0);

    res.status(200).json({
      message: 'Loan analytics retrieved successfully',
      data: {
        byLoanType,
        byStatus,
        totalLoans: loans.length,
        totalDisbursed,
        totalAMTPaid: totalAMT,
        averageEMI: disbursedLoans.length > 0 ? 
          disbursedLoans.reduce((sum, l) => sum + l.monthlyEMI, 0) / disbursedLoans.length : 0
      }
    });
  } catch (error) {
    console.error('Get loan analytics error:', error);
    res.status(500).json({ message: 'Failed to retrieve loan analytics', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find()
      .populate('customerId', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments();

    res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to retrieve notifications', error: error.message });
  }
};

export const generateReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;

    if (!reportType) {
      return res.status(400).json({ message: 'Report type is required' });
    }

    let data = {};

    switch (reportType) {
      case 'transactions':
        const query = {};
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        data = await Transaction.find(query)
          .populate('fromAccountId', 'accountNumber')
          .populate('toAccountId', 'accountNumber');
        break;

      case 'loans':
        const loanData = await Loan.find();
        data = {
          total: loanData.length,
          byStatus: loanData.reduce((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
          }, {}),
          loans: loanData
        };
        break;

      case 'customers':
        data = await Customer.find().select('firstName lastName email phone totalBalance createdAt');
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.status(200).json({
      message: 'Report generated successfully',
      data,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};
