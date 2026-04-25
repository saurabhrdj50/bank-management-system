// OTP Service - Generate, store, and verify OTPs
import crypto from 'crypto';
import { User } from '../models/index.js';

const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendOTP = async (email, type = 'email') => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY);
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    user.otp = {
      code: hashedOTP,
      expiresAt,
      attempts: 0,
      type
    };
    await user.save();

    // Simulate sending OTP (in production, use Twilio/SendGrid)
    console.log(`[OTP SENT] Email: ${email}, OTP: ${otp}`);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      expiryTime: 600 // 10 minutes in seconds
    };
  } catch (error) {
    throw error;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.otp || !user.otp.code) {
      throw new Error('No OTP requested');
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
      user.otp = null;
      await user.save();
      throw new Error('OTP expired');
    }

    // Check attempts
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      user.otp = null;
      await user.save();
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    // Verify OTP
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    if (hashedOTP !== user.otp.code) {
      user.otp.attempts += 1;
      await user.save();
      throw new Error('Invalid OTP');
    }

    // OTP verified successfully
    user.otp = null;
    await user.save();

    return { success: true, message: 'OTP verified' };
  } catch (error) {
    throw error;
  }
};

export const generate2FASecret = async (userId) => {
  try {
    const secret = crypto.randomBytes(32).toString('base64');
    const user = await User.findById(userId);
    
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false; // Will be enabled after verification
    await user.save();

    return secret;
  } catch (error) {
    throw error;
  }
};

export const verify2FA = async (userId, token) => {
  try {
    const user = await User.findById(userId);
    if (!user.twoFactorSecret) {
      throw new Error('2FA not configured');
    }

    // Simple verification (in production, use speakeasy or similar)
    // For demo: token should match derived code from secret
    const expectedToken = crypto
      .createHmac('sha256', user.twoFactorSecret)
      .update(Math.floor(Date.now() / 30000).toString())
      .digest('hex')
      .substring(0, 6);

    if (token !== expectedToken && token !== '000000') { // 000000 is demo token
      throw new Error('Invalid 2FA token');
    }

    user.twoFactorEnabled = true;
    await user.save();

    return { success: true, message: '2FA enabled successfully' };
  } catch (error) {
    throw error;
  }
};

export const disable2FA = async (userId, password) => {
  try {
    const user = await User.findById(userId);
    const bcryptjs = await import('bcryptjs');
    
    const isPasswordValid = await bcryptjs.default.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Incorrect password');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    return { success: true, message: '2FA disabled' };
  } catch (error) {
    throw error;
  }
};