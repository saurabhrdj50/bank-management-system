// Two-Factor Authentication Service

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate 2FA secret and QR code
 * @param {string} email - User email for the authenticator app
 * @returns {Promise<{secret: string, qrCode: string}>}
 */
export const generate2FASecret = async (email) => {
  try {
    const appName = 'Bank Management System';
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      issuer: appName,
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode
    };
  } catch (error) {
    console.error('2FA secret generation error:', error);
    throw new Error('Failed to generate 2FA secret');
  }
};

/**
 * Verify 2FA token
 * @param {string} token - 6-digit token from authenticator app
 * @param {string} secret - User's 2FA secret
 * @returns {boolean}
 */
export const verify2FAToken = (token, secret) => {
  try {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (before and after)
    });

    return isValid;
  } catch (error) {
    console.error('2FA token verification error:', error);
    return false;
  }
};

/**
 * Generate backup codes for 2FA recovery
 * @returns {string[]} Array of 8 backup codes
 */
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
};

/**
 * Verify backup code and remove it
 * @param {string} code - Backup code to verify
 * @param {string[]} backupCodes - Array of stored backup codes
 * @returns {{valid: boolean, remainingCodes: string[]}}
 */
export const verifyBackupCode = (code, backupCodes) => {
  const index = backupCodes.indexOf(code.toUpperCase());
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes };
  }

  // Remove used backup code
  const remainingCodes = backupCodes.filter((_, i) => i !== index);
  
  return { valid: true, remainingCodes };
};

/**
 * Check 2FA attempts and enforce rate limiting
 * @param {number} attempts - Current attempt count
 * @returns {boolean} True if within limits, false if exceeded
 */
export const check2FAAttempts = (attempts) => {
  const MAX_ATTEMPTS = 5;
  return attempts < MAX_ATTEMPTS;
};

/**
 * Generate device ID for trusted device tracking
 * @returns {string} Unique device ID
 */
export const generateDeviceId = () => {
  return crypto.randomBytes(16).toString('hex');
};
