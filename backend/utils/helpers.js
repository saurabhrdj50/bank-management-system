// Utility Helper Functions

export const generateAccountNumber = () => `ACC${Date.now()}${Math.floor(Math.random() * 10000)}`;

export const calculateEMI = (principal, rate, tenure) => {
  const monthlyRate = rate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.round(emi);
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const validatePhoneNumber = (phone) => /^[6-9]\d{9}$/.test(phone);
export const formatCurrency = (amount, currency = 'INR') => `₹${amount.toLocaleString()}`;
