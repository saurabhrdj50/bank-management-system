// Seed Script - Create demo users
import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Customer, Account, Transaction } from './models/index.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Customer.deleteMany({});
    await Account.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    const hashedPassword = await bcryptjs.hash('password', 10);

    // Create Admin Customer first
    const adminCustomer = await Customer.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@bank.com',
      phone: '+91-9876543210',
      dateOfBirth: new Date('1990-01-15'),
      address: { street: '123 Bank Street', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
      aadharNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      kyc: { verified: true, verificationDate: new Date() }
    });

    // Create Admin User with customerId
    const adminUser = await User.create({
      email: 'admin@bank.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      customerId: adminCustomer._id,
      twoFactorEnabled: false
    });

    // Create Regular Customer
    const customer = await Customer.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@bank.com',
      phone: '+91-9876543211',
      dateOfBirth: new Date('1992-05-20'),
      address: { street: '456 Customer Lane', city: 'Delhi', state: 'Delhi', zipCode: '110001', country: 'India' },
      aadharNumber: '987654321012',
      panNumber: 'XYZAB5678C',
      kyc: { verified: true, verificationDate: new Date() }
    });

    // Create Regular User with customerId
    const regularUser = await User.create({
      email: 'user@bank.com',
      password: hashedPassword,
      role: 'user',
      status: 'active',
      customerId: customer._id,
      twoFactorEnabled: false
    });

    // Create accounts for regular user
    const savingsAccount = await Account.create({
      customerId: customer._id,
      accountNumber: 'FINB0010001001',
      accountType: 'savings',
      balance: 50000,
      currency: 'INR',
      status: 'active',
      interestRate: 3.5
    });

    const currentAccount = await Account.create({
      customerId: customer._id,
      accountNumber: 'FINB0010001002',
      accountType: 'current',
      balance: 100000,
      currency: 'INR',
      status: 'active',
      interestRate: 0
    });

    // Create sample transactions
    await Transaction.insertMany([
      {
        fromAccountId: savingsAccount._id,
        type: 'deposit',
        amount: 50000,
        balanceBefore: 0,
        balanceAfter: 50000,
        description: 'Initial Deposit',
        status: 'completed',
        referenceNumber: 'TXN001'
      },
      {
        fromAccountId: currentAccount._id,
        type: 'deposit',
        amount: 100000,
        balanceBefore: 0,
        balanceAfter: 100000,
        description: 'Initial Deposit',
        status: 'completed',
        referenceNumber: 'TXN002'
      },
      {
        fromAccountId: savingsAccount._id,
        type: 'withdrawal',
        amount: 5000,
        balanceBefore: 50000,
        balanceAfter: 45000,
        description: 'ATM Withdrawal',
        status: 'completed',
        referenceNumber: 'TXN003'
      }
    ]);

    console.log('\n✅ Demo users created successfully!\n');
    console.log('Admin User:');
    console.log('  Email: admin@bank.com');
    console.log('  Password: password');
    console.log('  Customer ID:', adminCustomer._id.toString());
    console.log('  User ID:', adminUser._id.toString(), '\n');
    console.log('Regular User:');
    console.log('  Email: user@bank.com');
    console.log('  Password: password');
    console.log('  Customer ID:', customer._id.toString());
    console.log('  User ID:', regularUser._id.toString(), '\n');
    console.log('Accounts for user@bank.com:');
    console.log(`  - Savings: ${savingsAccount.accountNumber} (₹${savingsAccount.balance})`);
    console.log(`  - Current: ${currentAccount.accountNumber} (₹${currentAccount.balance})`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedUsers();
