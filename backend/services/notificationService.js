// Notification Service
import { Notification } from '../models/index.js';

export const sendTransactionNotification = async (customerId, data) => {
  const notification = new Notification({
    customerId,
    type: 'transaction',
    title: data.title,
    message: data.message,
  });
  await notification.save();
  return notification;
};

export const sendLoanNotification = async (customerId, status, amount) => {
  const notification = new Notification({
    customerId,
    type: 'loan',
    title: `Loan ${status}`,
    message: `Your loan application for ₹${amount} has been ${status}`,
  });
  await notification.save();
  return notification;
};
