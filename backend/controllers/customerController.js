// Customer Controller

import { Customer, Account, AuditLog, User } from '../models/index.js';
import { validatePhoneNumber, validateEmail } from '../utils/helpers.js';

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

export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.accountStatus = status;

    const customers = await Customer.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.status(200).json({
      message: 'Customers retrieved successfully',
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({ message: 'Failed to retrieve customers', error: error.message });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get associated accounts
    const accounts = await Account.find({ customerId: id });

    res.status(200).json({
      message: 'Customer retrieved successfully',
      data: {
        ...customer.toObject(),
        accounts
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Failed to retrieve customer', error: error.message });
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admin users may not have a customerId
    if (!user.customerId) {
      return res.status(200).json({
        message: 'Profile retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          isAdmin: true
        }
      });
    }

    const customer = await Customer.findById(user.customerId);
    if (!customer) {
      return res.status(200).json({
        message: 'Profile retrieved successfully',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          customerId: user.customerId
        }
      });
    }

    // Get accounts and calculate total balance
    const accounts = await Account.find({ customerId: user.customerId });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    res.status(200).json({
      message: 'Profile retrieved successfully',
      data: {
        ...customer.toObject(),
        totalBalance,
        accounts
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;
    const userId = req.userId;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate phone if provided
    if (phone && phone !== customer.phone) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }
      const existingPhone = await Customer.findOne({ phone, _id: { $ne: id } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    const changes = {};
    if (firstName && firstName !== customer.firstName) {
      changes.firstName = { old: customer.firstName, new: firstName };
      customer.firstName = firstName;
    }
    if (lastName && lastName !== customer.lastName) {
      changes.lastName = { old: customer.lastName, new: lastName };
      customer.lastName = lastName;
    }
    if (phone && phone !== customer.phone) {
      changes.phone = { old: customer.phone, new: phone };
      customer.phone = phone;
    }
    if (address) {
      changes.address = { old: customer.address, new: address };
      customer.address = address;
    }
    if (dateOfBirth) {
      changes.dateOfBirth = { old: customer.dateOfBirth, new: dateOfBirth };
      customer.dateOfBirth = dateOfBirth;
    }

    await customer.save();
    await logAuditAction(userId, 'UPDATE_CUSTOMER', 'Customer', id, changes, req);

    res.status(200).json({
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, dateOfBirth } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const customer = await Customer.findById(user.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate phone if provided
    if (phone && phone !== customer.phone) {
      if (!validatePhoneNumber(phone)) {
        return res.status(400).json({ message: 'Invalid phone number' });
      }
      const existingPhone = await Customer.findOne({ phone, _id: { $ne: customer._id } });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already in use' });
      }
    }

    const changes = {};
    if (firstName && firstName !== customer.firstName) {
      changes.firstName = { old: customer.firstName, new: firstName };
      customer.firstName = firstName;
    }
    if (lastName && lastName !== customer.lastName) {
      changes.lastName = { old: customer.lastName, new: lastName };
      customer.lastName = lastName;
    }
    if (phone && phone !== customer.phone) {
      changes.phone = { old: customer.phone, new: phone };
      customer.phone = phone;
    }
    if (address) {
      changes.address = { old: customer.address, new: address };
      customer.address = address;
    }
    if (dateOfBirth) {
      changes.dateOfBirth = { old: customer.dateOfBirth, new: dateOfBirth };
      customer.dateOfBirth = dateOfBirth;
    }

    await customer.save();
    await logAuditAction(userId, 'UPDATE_PROFILE', 'Customer', customer._id, changes, req);

    res.status(200).json({
      message: 'Profile updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has active accounts
    const activeAccounts = await Account.find({ customerId: id, status: 'active' });
    if (activeAccounts.length > 0) {
      return res.status(400).json({ message: 'Cannot delete customer with active accounts' });
    }

    await Customer.findByIdAndDelete(id);
    await logAuditAction(userId, 'DELETE_CUSTOMER', 'Customer', id, { email: customer.email }, req);

    res.status(200).json({
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
};

export const verifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { aadharNumber, panNumber } = req.body;
    const userId = req.userId;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (aadharNumber) {
      const existingAadhar = await Customer.findOne({ aadharNumber, _id: { $ne: id } });
      if (existingAadhar) {
        return res.status(400).json({ message: 'Aadhar number already registered' });
      }
      customer.aadharNumber = aadharNumber;
    }

    if (panNumber) {
      const existingPan = await Customer.findOne({ panNumber, _id: { $ne: id } });
      if (existingPan) {
        return res.status(400).json({ message: 'PAN number already registered' });
      }
      customer.panNumber = panNumber;
    }

    customer.kyc.verified = true;
    customer.kyc.verificationDate = new Date();

    await customer.save();
    await logAuditAction(userId, 'VERIFY_KYC', 'Customer', id, { aadharNumber, panNumber }, req);

    res.status(200).json({
      message: 'KYC verified successfully',
      data: customer
    });
  } catch (error) {
    console.error('KYC verification error:', error);
    res.status(500).json({ message: 'Failed to verify KYC', error: error.message });
  }
};
