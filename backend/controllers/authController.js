// Authentication Controller

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Customer, Account, AuditLog } from '../models/index.js';
import { validateEmail, validatePhoneNumber } from '../utils/helpers.js';
import { generateOTP } from '../services/otpService.js';
import { generate2FASecret, verify2FAToken, generateBackupCodes } from '../services/twoFactorService.js';

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const generateAccessToken = (userId, role) => 
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '24h' });

const generateRefreshToken = (userId) => 
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

export const register = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password min 6 chars' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords mismatch' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const existingPhone = await Customer.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, message: 'Phone already registered' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create customer profile
    const customer = new Customer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      phone,
      accountStatus: 'active',
      kyc: { verified: true, verificationDate: new Date() }
    });
    await customer.save();

    // Create user account
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      customerId: customer._id,
      status: 'active'
    });
    await user.save();

    // Create default savings account
    const { Account } = await import('../models/index.js');
    const { generateAccountNumber } = await import('../utils/helpers.js');
    const account = new Account({
      customerId: customer._id,
      accountNumber: generateAccountNumber(),
      accountType: 'savings',
      balance: 0,
      status: 'active',
      interestRate: 3.5
    });
    await account.save();

    await logAuditAction(user._id, 'REGISTER', 'User', user._id, { email }, req);

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        customerId: customer._id,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          kycVerified: true
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ success: false, message: 'Account locked. Try later' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update user on successful login
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Fetch customer data
    const customer = user.customerId ? await Customer.findById(user.customerId) : null;

    // Log audit
    await logAuditAction(user._id, 'LOGIN', 'User', user._id, { email }, req);

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        customer: customer ? {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          accountStatus: customer.accountStatus,
          kycVerified: customer.kyc?.verified || false
        } : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
};

export const verifyOTPLogin = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check OTP expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Request a new one' });
    }

    // Check OTP attempts
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many OTP attempts. Try again later' });
    }

    // Verify OTP
    const hashedOTP = hashOTP(otp);
    if (hashedOTP !== user.otp) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Fetch customer data
    const customer = await Customer.findById(user.customerId);

    // Log audit
    await logAuditAction(user._id, 'LOGIN_2FA_SUCCESS', 'User', user._id, {}, req);

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          accountStatus: customer.accountStatus,
          totalBalance: customer.totalBalance
        }
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch customer data if exists
    const customer = user.customerId ? await Customer.findById(user.customerId) : null;

    // Get accounts if customer exists
    const accounts = customer ? await Account.find({ customerId: customer._id }) : [];
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        lastLogin: user.lastLogin,
        twoFactorEnabled: user.twoFactorEnabled,
        customer: customer ? {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          dateOfBirth: customer.dateOfBirth,
          aadharNumber: customer.aadharNumber,
          panNumber: customer.panNumber,
          kycVerified: customer.kyc?.verified || false,
          accountStatus: customer.accountStatus,
          totalBalance
        } : {
          isAdmin: true,
          totalBalance: 0
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: error.message });
  }
};

export const setup2FA = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 2FA secret
    const { secret, qrCode } = await generate2FASecret(user.email);
    const backupCodes = generateBackupCodes();

    // Store temporarily (not verified yet)
    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    user.twoFactorVerified = false;
    await user.save();

    await logAuditAction(userId, '2FA_SETUP_INITIATED', 'User', userId, {}, req);

    res.status(200).json({
      message: '2FA setup initiated',
      secret,
      qrCode,
      backupCodes,
      message2: 'Scan the QR code with your authenticator app and verify the token to complete setup'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: '2FA setup failed', error: error.message });
  }
};

export const verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'No pending 2FA setup' });
    }

    // Verify 2FA token
    const isValid = verify2FAToken(token, user.twoFactorSecret);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid 2FA token' });
    }

    // Mark 2FA as verified and enabled
    user.twoFactorEnabled = true;
    user.twoFactorVerified = true;
    await user.save();

    await logAuditAction(userId, '2FA_SETUP_COMPLETED', 'User', userId, {}, req);

    res.status(200).json({
      message: '2FA enabled successfully',
      twoFactorEnabled: true
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ message: '2FA verification failed', error: error.message });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorVerified = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    await logAuditAction(userId, '2FA_DISABLED', 'User', userId, {}, req);

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      message: 'Token refreshed',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.userId;
    await logAuditAction(userId, 'LOGOUT', 'User', userId, {}, req);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await logAuditAction(userId, 'CHANGE_PASSWORD', 'User', userId, {}, req);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};
