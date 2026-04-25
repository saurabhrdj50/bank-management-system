# Backend Implementation Summary (AI-READY)

**Version:** 2.0.0  
**Last Updated:** March 28, 2026  
**Framework:** Node.js + Express.js + MongoDB  
**Purpose:** Complete backend reconstruction documentation for AI agents and developers

---

## 📂 Project Structure

```
backend/
├── config/
│   └── database.js                # MongoDB connection configuration
│
├── controllers/                  # Business logic (48 functions)
│   ├── authController.js         # Authentication & authorization
│   ├── customerController.js     # Customer profile management
│   ├── accountController.js      # Account operations (CRUD)
│   ├── transactionController.js # Transaction history & analytics
│   ├── loanController.js         # Loan lifecycle management
│   └── adminController.js        # Admin dashboard & reports
│
├── middleware/
│   ├── auth.js                   # JWT verification & role checking
│   └── security.js              # Rate limiting, CORS, sanitization
│
├── models/
│   └── index.js                 # Mongoose schemas (7 models)
│
├── routes/
│   └── index.js                 # API route definitions (42 endpoints)
│
├── services/
│   ├── otpService.js           # OTP generation & validation
│   └── twoFactorService.js     # TOTP 2FA implementation
│
├── utils/
│   └── helpers.js               # Utility functions
│
├── seed.js                      # Database seeding script
├── server.js                    # Express server entry point
├── package.json                  # Dependencies
├── .env                         # Environment variables
└── .env.example                # Environment template
```

---

## 🗄️ Database Models

### Schema Overview (models/index.js)

#### 1. User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: Enum ['user', 'admin'] (default: 'user'),
  customerId: ObjectId (ref: Customer),
  twoFactorEnabled: Boolean (default: false),
  twoFactorSecret: String (encrypted),
  backupCodes: [String] (hashed),
  failedLoginAttempts: Number (default: 0),
  lockedUntil: Date,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Customer Model
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (unique, required),
  phone: String (required),
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  aadharNumber: String (encrypted),
  panNumber: String (encrypted),
  kycVerified: Boolean (default: false),
  kycVerifiedAt: Date,
  status: Enum ['active', 'inactive', 'suspended'],
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Account Model
```javascript
{
  _id: ObjectId,
  accountNumber: String (unique, auto-generated),
  customerId: ObjectId (ref: Customer, required),
  accountType: Enum ['savings', 'current', 'fixed_deposit', 'recurring'],
  balance: Number (default: 0, min: 0),
  status: Enum ['active', 'inactive', 'closed', 'frozen'],
  interestRate: Number (annual percentage),
  minBalance: Number (required for savings),
  dailyWithdrawalLimit: Number (default: 50000),
  dailyTransactionLimit: Number (default: 100000),
  branchCode: String,
  openedAt: Date,
  closedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Transaction Model
```javascript
{
  _id: ObjectId,
  accountId: ObjectId (ref: Account, required),
  customerId: ObjectId (ref: Customer, required),
  type: Enum ['deposit', 'withdrawal', 'transfer', 'emi_payment', 'interest'],
  amount: Number (required),
  balanceBefore: Number,
  balanceAfter: Number,
  description: String,
  referenceNumber: String (unique, auto-generated),
  status: Enum ['pending', 'completed', 'failed', 'reversed'],
  transactionMode: Enum ['online', 'atm', 'branch', 'upi'],
  metadata: {
    beneficiaryAccount: ObjectId,
    beneficiaryName: String,
    utrNumber: String,
    remarks: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. Loan Model
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer, required),
  loanType: Enum ['personal', 'home', 'auto', 'business', 'education'],
  principalAmount: Number (required),
  interestRate: Number (annual percentage),
  tenure: Number (months),
  tenureType: Enum ['months', 'years'],
  monthlyEMI: Number,
  totalAmount: Number,
  amountPaid: Number (default: 0),
  amountRemaining: Number,
  status: Enum ['pending', 'approved', 'disbursed', 'active', 'closed', 'rejected'],
  disbursedAmount: Number,
  disbursedAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId,
  rejectionReason: String,
  startDate: Date,
  endDate: Date,
  nextPaymentDate: Date,
  paymentHistory: [{
    emiNumber: Number,
    amount: Number,
    paidAt: Date,
    paidOnTime: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. Notification Model
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer, required),
  type: Enum ['transaction', 'loan', 'security', 'alert', 'info'],
  title: String (required),
  message: String (required),
  read: Boolean (default: false),
  priority: Enum ['low', 'medium', 'high'],
  actionUrl: String,
  createdAt: Date
}
```

#### 7. AuditLog Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (required),
  action: String (required),
  entityType: String (e.g., 'Account', 'Loan'),
  entityId: ObjectId,
  changes: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date (default: now)
}
```

---

## 🔗 Complete API Routes

### Authentication Routes (`/api/auth/*`)

#### POST /api/auth/register
```javascript
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210"
}

// Response (201 Created)
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@example.com",
    "role": "user",
    "customerId": "65f8a1b2c3d4e5f6a7b8c9d1"
  }
}
```

#### POST /api/auth/login
```javascript
// Request Body
{
  "email": "user@bank.com",
  "password": "password"
}

// Response (200 OK)
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@bank.com",
    "role": "user",
    "customerId": "65f8a1b2c3d4e5f6a7b8c9d1",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "totalBalance": 150000
    }
  }
}
```

#### GET /api/auth/profile
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "65f8a1b2c3d4e5f6a7b8c9d0",
    "email": "user@bank.com",
    "role": "user",
    "customerId": "65f8a1b2c3d4e5f6a7b8c9d1",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@bank.com",
      "phone": "+91-9876543210",
      "kycVerified": true
    },
    "accounts": [
      {
        "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
        "accountNumber": "FINB0010001001",
        "accountType": "savings",
        "balance": 50000,
        "status": "active"
      }
    ],
    "totalBalance": 150000
  }
}
```

#### POST /api/auth/logout
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /api/auth/change-password
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}

// Response (200 OK)
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### POST /api/auth/refresh-token
```javascript
// Request Body
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response (200 OK)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/setup-2fa
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/FinBank:user@bank.com?secret=JBSWY3DPEHPK3PXP&issuer=FinBank",
    "backupCodes": ["a1b2c3d4", "e5f6g7h8", ...]
  }
}
```

#### POST /api/auth/verify-2fa-setup
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "token": "123456"
}

// Response (200 OK)
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

#### POST /api/auth/verify-otp-login
```javascript
// Request Body
{
  "email": "user@bank.com",
  "otp": "123456"
}

// Response (200 OK)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Account Routes (`/api/accounts/*`)

#### GET /api/accounts
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
      "accountNumber": "FINB0010001001",
      "accountType": "savings",
      "balance": 50000,
      "status": "active",
      "interestRate": 3.5,
      "openedAt": "2025-03-28T10:00:00Z"
    },
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d3",
      "accountNumber": "FINB0010001002",
      "accountType": "current",
      "balance": 100000,
      "status": "active",
      "interestRate": 0,
      "openedAt": "2025-03-28T10:00:00Z"
    }
  ]
}
```

#### POST /api/accounts
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "customerId": "65f8a1b2c3d4e5f6a7b8c9d1",
  "accountType": "savings",
  "initialDeposit": 1000
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d4",
    "accountNumber": "FINB0010001003",
    "accountType": "savings",
    "balance": 1000,
    "status": "active"
  }
}
```

#### GET /api/accounts/:accountId
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
    "accountNumber": "FINB0010001001",
    "accountType": "savings",
    "balance": 50000,
    "status": "active",
    "interestRate": 3.5,
    "minBalance": 1000,
    "dailyWithdrawalLimit": 50000,
    "openedAt": "2025-03-28T10:00:00Z"
  }
}
```

#### POST /api/accounts/:accountId/deposit
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "amount": 5000,
  "description": "Cash deposit"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "account": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
      "balance": 55000
    },
    "transaction": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d5",
      "referenceNumber": "DEP-202603281000001",
      "amount": 5000,
      "balanceBefore": 50000,
      "balanceAfter": 55000,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  }
}
```

#### POST /api/accounts/:accountId/withdraw
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "amount": 2000,
  "description": "ATM withdrawal"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "account": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
      "balance": 53000
    },
    "transaction": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d6",
      "referenceNumber": "WDL-202603281000002",
      "amount": 2000,
      "balanceBefore": 55000,
      "balanceAfter": 53000,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  }
}
```

#### POST /api/accounts/transfer
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "fromAccountId": "65f8a1b2c3d4e5f6a7b8c9d2",
  "toAccountId": "65f8a1b2c3d4e5f6a7b8c9d3",
  "amount": 5000,
  "description": "Fund transfer"
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "fromTransaction": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d7",
      "referenceNumber": "TRF-202603281000003",
      "type": "transfer",
      "amount": 5000,
      "balanceBefore": 53000,
      "balanceAfter": 48000
    },
    "toTransaction": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d8",
      "referenceNumber": "TRF-202603281000004",
      "type": "deposit",
      "amount": 5000,
      "balanceBefore": 100000,
      "balanceAfter": 105000
    }
  }
}
```

#### POST /api/accounts/:accountId/close
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Account closed successfully"
}
```

### Transaction Routes (`/api/transactions/*`)

#### GET /api/transactions
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?accountId=65f8a1b2c3d4e5f6a7b8c9d2  // optional
&page=1                                    // default: 1
&limit=10                                  // default: 10
&type=deposit                              // optional filter
&startDate=2026-01-01                     // optional
&endDate=2026-03-28                       // optional

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d5",
      "accountId": "65f8a1b2c3d4e5f6a7b8c9d2",
      "type": "deposit",
      "amount": 5000,
      "balanceBefore": 50000,
      "balanceAfter": 55000,
      "description": "Cash deposit",
      "referenceNumber": "DEP-202603281000001",
      "status": "completed",
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
```

#### GET /api/accounts/:accountId/mini-statement
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d5",
      "type": "deposit",
      "amount": 5000,
      "balanceAfter": 55000,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

#### GET /api/accounts/:accountId/analytics
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "totalDeposits": 50000,
    "totalWithdrawals": 10000,
    "totalTransfers": 25000,
    "netBalance": 150000,
    "transactionCount": 15,
    "averageTransaction": 5666.67,
    "monthlyBreakdown": [
      {
        "month": "2026-03",
        "deposits": 30000,
        "withdrawals": 5000
      }
    ],
    "transactionTypes": {
      "deposit": 10,
      "withdrawal": 3,
      "transfer": 2
    }
  }
}
```

#### GET /api/transactions/:transactionId
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d5",
    "accountId": "65f8a1b2c3d4e5f6a7b8c9d2",
    "type": "deposit",
    "amount": 5000,
    "balanceBefore": 50000,
    "balanceAfter": 55000,
    "description": "Cash deposit",
    "referenceNumber": "DEP-202603281000001",
    "status": "completed",
    "metadata": {},
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

#### POST /api/transactions/:transactionId/fraud-check (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "isFraudulent": false,
    "riskScore": 15,
    "flags": []
  }
}
```

#### GET /api/accounts/:accountId/statement/download
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?startDate=2026-01-01
&endDate=2026-03-28

// Response (200 OK)
// Content-Type: text/csv
// Downloadable CSV file
```

### Loan Routes (`/api/loans/*`)

#### POST /api/loans/apply
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "customerId": "65f8a1b2c3d4e5f6a7b8c9d1",
  "loanType": "personal",
  "principalAmount": 50000,
  "tenure": 12,
  "accountId": "65f8a1b2c3d4e5f6a7b8c9d2"
}

// Response (201 Created)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
    "loanType": "personal",
    "principalAmount": 50000,
    "interestRate": 8.5,
    "tenure": 12,
    "monthlyEMI": 4280,
    "totalAmount": 51360,
    "status": "pending",
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

#### GET /api/loans/:loanId
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
    "loanType": "personal",
    "principalAmount": 50000,
    "interestRate": 8.5,
    "tenure": 12,
    "monthlyEMI": 4280,
    "totalAmount": 51360,
    "amountPaid": 0,
    "amountRemaining": 51360,
    "status": "pending",
    "createdAt": "2026-03-28T10:00:00Z"
  }
}
```

#### GET /api/customers/:customerId/loans
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?status=pending  // optional filter

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
      "loanType": "personal",
      "principalAmount": 50000,
      "status": "pending",
      "monthlyEMI": 4280,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

#### GET /api/loans (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?status=pending
&page=1
&limit=10

// Response (200 OK)
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### POST /api/loans/:loanId/approve (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Loan approved",
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
    "status": "approved",
    "approvedAt": "2026-03-28T11:00:00Z",
    "approvedBy": "65f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

#### POST /api/loans/:loanId/reject (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "reason": "Insufficient income proof"
}

// Response (200 OK)
{
  "success": true,
  "message": "Loan rejected",
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
    "status": "rejected",
    "rejectionReason": "Insufficient income proof"
  }
}
```

#### POST /api/loans/:loanId/disburse (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Loan disbursed",
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d9",
    "status": "disbursed",
    "disbursedAmount": 50000,
    "disbursedAt": "2026-03-28T12:00:00Z"
  }
}
```

#### POST /api/loans/pay-emi
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "loanId": "65f8a1b2c3d4e5f6a7b8c9d9",
  "amount": 4280,
  "accountId": "65f8a1b2c3d4e5f6a7b8c9d2"
}

// Response (200 OK)
{
  "success": true,
  "message": "EMI paid successfully",
  "data": {
    "loanId": "65f8a1b2c3d4e5f6a7b8c9d9",
    "amountPaid": 4280,
    "amountRemaining": 47080,
    "nextPaymentDate": "2026-04-28"
  }
}
```

### Customer Routes (`/api/customers/*`)

#### GET /api/customers (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?page=1
&limit=10
&status=active

// Response (200 OK)
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### GET /api/customers/:id (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@bank.com",
    "phone": "+91-9876543210",
    "kycVerified": true,
    "status": "active",
    "accounts": [...],
    "loans": [...]
  }
}
```

#### PUT /api/customers/:id (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "phone": "+91-9876543211"
}

// Response (200 OK)
{
  "success": true,
  "message": "Customer updated successfully"
}
```

#### DELETE /api/customers/:id (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

#### GET /api/profile
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "_id": "65f8a1b2c3d4e5f6a7b8c9d1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@bank.com",
    "phone": "+91-9876543210",
    "kycVerified": true,
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India"
    }
  }
}
```

#### PUT /api/profile
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "phone": "+91-9876543211",
  "address": {
    "street": "456 New St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400002",
    "country": "India"
  }
}

// Response (200 OK)
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### POST /api/customers/:id/verify-kyc (Admin)
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "message": "KYC verified successfully",
  "data": {
    "kycVerified": true,
    "kycVerifiedAt": "2026-03-28T10:00:00Z"
  }
}
```

### Admin Routes (`/api/admin/*`)

#### GET /api/admin/dashboard
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1250,
      "totalAccounts": 1580,
      "totalBalance": 250000000,
      "pendingLoans": 45
    },
    "recentTransactions": [...],
    "topCustomers": [...]
  }
}
```

#### GET /api/admin/transactions
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?page=1
&limit=20
&startDate=2026-01-01
&endDate=2026-03-28

// Response (200 OK)
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### GET /api/admin/users
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?page=1
&limit=10
&role=user
&status=active

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "email": "user@bank.com",
      "role": "user",
      "isActive": true,
      "customerId": "65f8a1b2c3d4e5f6a7b8c9d1",
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### PUT /api/admin/users/:userId/status
```javascript
// Headers
Authorization: Bearer <token>

// Request Body
{
  "status": "suspended"
}

// Response (200 OK)
{
  "success": true,
  "message": "User status updated"
}
```

#### GET /api/admin/audit-logs
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?page=1
&limit=50
&userId=65f8a1b2c3d4e5f6a7b8c9d0

// Response (200 OK)
{
  "success": true,
  "data": [
    {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d10",
      "userId": "65f8a1b2c3d4e5f6a7b8c9d0",
      "action": "LOGIN",
      "entityType": "User",
      "entityId": "65f8a1b2c3d4e5f6a7b8c9d0",
      "ipAddress": "192.168.1.1",
      "timestamp": "2026-03-28T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

#### GET /api/admin/analytics/customers
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "totalCustomers": 1250,
    "activeCustomers": 1180,
    "kycVerified": 980,
    "newCustomersThisMonth": 45,
    "customersByType": {
      "individual": 1100,
      "business": 150
    },
    "topAccounts": [...]
  }
}
```

#### GET /api/admin/analytics/loans
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "totalLoans": 320,
    "pending": 45,
    "approved": 180,
    "disbursed": 95,
    "rejected": 25,
    "totalAmountDisbursed": 15000000,
    "totalAmountRecovered": 8500000,
    "defaultRate": 2.5
  }
}
```

#### GET /api/admin/notifications
```javascript
// Headers
Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": [...]
}
```

#### GET /api/admin/reports
```javascript
// Headers
Authorization: Bearer <token>

// Query Parameters
?type=transactions
&startDate=2026-01-01
&endDate=2026-03-28
&format=csv

// Response (200 OK)
// Content-Type: application/pdf or text/csv
// Downloadable report file
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow
```javascript
// 1. Token Generation (Login)
const generateAccessToken = (userId, role) => 
  jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // Access token expires in 15 minutes
  );

const generateRefreshToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Refresh token expires in 7 days
  );

// 2. Token Verification (Middleware)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// 3. Role-Based Access Control
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  next();
};

const isUser = (req, res, next) => {
  if (req.userRole !== 'user' && req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'User access required' 
    });
  }
  next();
};
```

### Middleware Stack (server.js)
```javascript
// Order of middleware execution
app.use(checkIPBlacklist);        // 1. IP blocking
app.use(helmet());                // 2. Security headers
app.use(cors(corsConfig));        // 3. CORS
app.use(securityHeaders);          // 4. Custom security headers
app.use(sanitizeData);             // 5. Input sanitization
app.use(express.json());          // 6. JSON parsing
app.use(generalLimiter);          // 7. Rate limiting (general)
app.use(validateRequest);         // 8. Request validation

// Route-specific rate limiters
app.use('/api/auth/login', authLimiter);      // 5 requests per 15 min
app.use('/api/auth/register', authLimiter);  // 3 requests per 15 min
app.use('/api/transactions', transactionLimiter);  // 30 requests per min
```

---

## 🧠 Business Logic Flows

### 1. User Registration Flow
```
1. POST /api/auth/register
   ├── Validate email format
   ├── Validate password strength
   ├── Validate phone number
   ├── Check if email already exists
   ├── Hash password with bcryptjs (10 rounds)
   ├── Create Customer document
   ├── Create User document (link to Customer)
   ├── Create default Savings Account
   ├── Generate JWT tokens
   ├── Send welcome notification
   ├── Create audit log
   └── Return { token, user }
```

### 2. Login Flow
```
1. POST /api/auth/login
   ├── Check if account locked
   ├── Find user by email
   ├── Compare password with bcryptjs
   ├── Check if 2FA enabled
   │   ├── Yes: Generate OTP, send to email, return OTP required
   │   └── No: Continue
   ├── Generate JWT tokens
   ├── Reset failed login attempts
   ├── Create audit log
   ├── Send login notification
   └── Return { token, user, customer }
```

### 3. Deposit Flow
```
1. POST /api/accounts/:accountId/deposit
   ├── Verify JWT token
   ├── Validate account ownership
   ├── Check account status (must be active)
   ├── Validate amount (> 0, <= daily limit)
   ├── Start transaction
   ├── Update account balance (+amount)
   ├── Create Transaction record
   ├── Create notification
   ├── Create audit log
   ├── Commit transaction
   └── Return { account, transaction }
```

### 4. Withdrawal Flow
```
1. POST /api/accounts/:accountId/withdraw
   ├── Verify JWT token
   ├── Validate account ownership
   ├── Check account status
   ├── Check balance >= amount
   ├── Check daily withdrawal limit
   ├── Start transaction
   ├── Update account balance (-amount)
   ├── Create Transaction record
   ├── Create notification
   ├── Create audit log
   ├── Commit transaction
   └── Return { account, transaction }
```

### 5. Transfer Flow
```
1. POST /api/accounts/transfer
   ├── Verify JWT token
   ├── Validate source account ownership
   ├── Check source account balance
   ├── Find destination account
   ├── Validate both accounts active
   ├── Check daily transaction limit
   ├── Start transaction (atomic)
   ├── Deduct from source account
   ├── Add to destination account
   ├── Create source Transaction (type: transfer)
   ├── Create destination Transaction (type: deposit)
   ├── Create notifications for both parties
   ├── Create audit logs
   ├── Commit transaction
   └── Return { fromTransaction, toTransaction }
```

### 6. Loan Application Flow
```
1. POST /api/loans/apply
   ├── Verify JWT token
   ├── Validate customer ownership
   ├── Check customer KYC status (bypassed for demo)
   ├── Calculate interest rate based on loan type
   ├── Calculate monthly EMI
   ├── Calculate total amount
   ├── Create Loan document (status: pending)
   ├── Create notification
   ├── Create audit log
   └── Return loan details
```

### 7. Loan Approval Flow (Admin)
```
1. POST /api/loans/:loanId/approve (Admin)
   ├── Verify JWT token (admin only)
   ├── Find loan by ID
   ├── Check loan status (must be pending)
   ├── Update loan status to 'approved'
   ├── Set approvedBy and approvedAt
   ├── Create notification for customer
   ├── Create audit log
   └── Return updated loan
```

### 8. Loan Disbursement Flow (Admin)
```
1. POST /api/loans/:loanId/disburse (Admin)
   ├── Verify JWT token (admin only)
   ├── Find loan by ID
   ├── Check loan status (must be approved)
   ├── Validate disbursement account exists
   ├── Check account balance >= principal
   ├── Start transaction
   ├── Deduct from system/admin account
   ├── Add to customer's account
   ├── Create Transaction record
   ├── Update loan status to 'disbursed'
   ├── Set disbursedAmount and disbursedAt
   ├── Set nextPaymentDate (1 month from now)
   ├── Create notification
   ├── Create audit log
   ├── Commit transaction
   └── Return loan details
```

### 9. EMI Payment Flow
```
1. POST /api/loans/pay-emi
   ├── Verify JWT token
   ├── Find loan by ID
   ├── Validate loan ownership
   ├── Check loan status (must be disbursed or active)
   ├── Check account balance >= monthlyEMI
   ├── Start transaction
   ├── Deduct from account
   ├── Update loan (amountPaid += monthlyEMI)
   ├── Update loan (amountRemaining -= monthlyEMI)
   ├── Update payment history
   ├── Check if loan is fully paid
   │   ├── Yes: Set status to 'closed'
   │   └── No: Set nextPaymentDate (+1 month)
   ├── Create Transaction record
   ├── Create notification
   ├── Create audit log
   ├── Commit transaction
   └── Return updated loan
```

### 10. Fraud Detection Flow
```
1. POST /api/transactions/:transactionId/fraud-check (Admin)
   ├── Verify JWT token (admin only)
   ├── Find transaction
   ├── Calculate risk score based on:
   │   ├── Transaction amount
   │   ├── Transaction frequency
   │   ├── Time of transaction
   │   ├── User's transaction history
   │   └── Unusual patterns
   ├── Flag if risk score > threshold
   ├── Return { isFraudulent, riskScore, flags }
```

---

## 🔧 Middleware Security

### Rate Limiting (security.js)
```javascript
// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: { success: false, message: 'Too many requests' }
});

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts per window
  message: { success: false, message: 'Too many login attempts' }
});

// Transaction rate limiter
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,  // 30 transactions per minute
  message: { success: false, message: 'Too many transactions' }
});

// OTP rate limiter
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 3,  // 3 OTP requests per minute
  message: { success: false, message: 'Too many OTP requests' }
});
```

### Input Sanitization (security.js)
```javascript
// Sanitize request body to prevent NoSQL injection
app.use(mongoSanitize());

// Sanitize request query parameters
app.use((req, res, next) => {
  req.query = mongoSanitize(req.query);
  next();
});

// Helmet.js for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  }
}));
```

### CORS Configuration (security.js)
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

---

## 📧 OTP & 2FA System

### OTP Generation (otpService.js)
```javascript
import crypto from 'crypto';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOTP = (userOTP, storedHash) => {
  const hashedOTP = hashOTP(userOTP);
  return hashedOTP === storedHash;
};

export { generateOTP, hashOTP, verifyOTP };
```

### 2FA TOTP Setup (twoFactorService.js)
```javascript
import speakeasy from 'speakeasy';

const generate2FASecret = () => {
  return speakeasy.generateSecret({
    name: `FinBank:${user.email}`,
    length: 20
  });
};

const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1  // Allow 1 step tolerance
  });
};

const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
};

export { generate2FASecret, verify2FAToken, generateBackupCodes };
```

### Email Service (Nodemailer)
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',  // or other email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'FinBank - Your OTP Code',
    html: `
      <h1>Your OTP Code</h1>
      <p>Your one-time password is: <strong>${otp}</strong></p>
      <p>This code expires in 5 minutes.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
};
```

---

## 🛠️ Utility Functions (utils/helpers.js)

### Account Number Generation
```javascript
export const generateAccountNumber = () => {
  const prefix = 'FINB';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};
```

### Reference Number Generation
```javascript
export const generateReferenceNumber = (type) => {
  const prefix = type.toUpperCase().substring(0, 3);
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};
```

### EMI Calculation
```javascript
export const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
};
```

### Interest Rate by Loan Type
```javascript
export const getInterestRate = (loanType) => {
  const rates = {
    personal: 8.5,
    home: 6.5,
    auto: 7.5,
    business: 9.5,
    education: 8.0
  };
  return rates[loanType] || 8.5;
};
```

### Validation Functions
```javascript
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhoneNumber = (phone) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};
```

---

## 🧪 Database Seeding (seed.js)

### Demo Users Creation
```javascript
const seedUsers = async () => {
  // 1. Create Admin User
  const adminUser = await User.create({
    email: 'admin@bank.com',
    password: await bcryptjs.hash('password', 10),
    role: 'admin',
    customerId: adminCustomer._id
  });
  
  // 2. Create Regular User
  const regularUser = await User.create({
    email: 'user@bank.com',
    password: await bcryptjs.hash('password', 10),
    role: 'user',
    customerId: regularCustomer._id
  });
  
  // 3. Create Accounts for Regular User
  const savingsAccount = await Account.create({
    customerId: regularCustomer._id,
    accountType: 'savings',
    balance: 50000,
    status: 'active',
    interestRate: 3.5,
    minBalance: 1000
  });
  
  const currentAccount = await Account.create({
    customerId: regularCustomer._id,
    accountType: 'current',
    balance: 100000,
    status: 'active',
    interestRate: 0,
    minBalance: 5000
  });
  
  // 4. Create Sample Transactions
  await Transaction.create([
    {
      accountId: savingsAccount._id,
      customerId: regularCustomer._id,
      type: 'deposit',
      amount: 50000,
      balanceBefore: 0,
      balanceAfter: 50000,
      status: 'completed'
    },
    {
      accountId: currentAccount._id,
      customerId: regularCustomer._id,
      type: 'deposit',
      amount: 100000,
      balanceBefore: 0,
      balanceAfter: 100000,
      status: 'completed'
    }
  ]);
};
```

---

## 🔧 Environment Variables

### Backend (.env)
```
# MongoDB Connection
MONGO_URI=mongodb+srv://admin:admin123@cluster0.ypm64b5.mongodb.net/bank_management_system

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Email (for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Encryption (for sensitive data)
ENCRYPTION_KEY=your-32-character-encryption-key
```

---

## 🚀 Server Startup

### Development Mode
```bash
cd backend
npm run dev
# Uses nodemon for auto-restart on file changes
# Server runs on http://localhost:5000
```

### Production Mode
```bash
cd backend
npm start
# Direct node execution
# Server runs on http://localhost:5000
```

### Server Initialization (server.js)
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import routes from './routes/index.js';
import { generalLimiter, authLimiter, sanitizeData, securityHeaders, corsConfig } from './middleware/security.js';

dotenv.config();
const app = express();

// Connect to MongoDB
await connectDB();

// Security Middleware
app.use(helmet());
app.use(cors(corsConfig));
app.use(securityHeaders);
app.use(sanitizeData);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || 'Internal Server Error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Bank Management System - Backend running on port ${PORT}`);
});
```

---

## 📊 Error Handling

### Controller Error Pattern
```javascript
export const deposit = async (req, res) => {
  try {
    // 1. Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }
    
    // 2. Find account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Account not found' 
      });
    }
    
    // 3. Check permissions
    if (account.customerId.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // 4. Perform operation
    const balanceBefore = account.balance;
    account.balance += amount;
    await account.save();
    
    // 5. Create transaction record
    const transaction = await Transaction.create({
      accountId: account._id,
      amount,
      balanceBefore,
      balanceAfter: account.balance
    });
    
    // 6. Return success
    return res.status(200).json({
      success: true,
      data: { account, transaction }
    });
    
  } catch (error) {
    // 7. Handle errors
    console.error('Deposit error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
```

### Standardized Response Format
```javascript
// Success response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "pagination": { /* if applicable */ }
}

// Error response
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if any */ ]
}
```

---

## ✅ Testing Endpoints

### Backend Health Check
```bash
curl http://localhost:5000/health
# Response: { "status": "UP", "timestamp": "2026-03-28T10:00:00Z" }
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bank.com","password":"password"}'
```

### Test Protected Route
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token_here>"
```

---

## 🎯 Key Implementation Patterns

### 1. Async/Await Error Handling
```javascript
// Always wrap database operations in try-catch
const getData = async (req, res) => {
  try {
    const data = await Model.find();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 2. Transaction Atomicity
```javascript
// Use Mongoose sessions for multi-document transactions
const performTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Operations within transaction
    await Account.updateOne({ _id: fromId }, { $inc: { balance: -amount } }, { session });
    await Account.updateOne({ _id: toId }, { $inc: { balance: amount } }, { session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
  } finally {
    session.endSession();
  }
};
```

### 3. Pagination
```javascript
const getPaginatedData = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    Model.find().skip(skip).limit(limit),
    Model.countDocuments()
  ]);
  
  res.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    }
  });
};
```

### 4. Middleware Chaining
```javascript
// Use multiple middleware for complex validations
router.post('/route',
  validateInput,        // 1. Validate request body
  checkPermissions,     // 2. Check user permissions
  rateLimiter,          // 3. Apply rate limiting
  controllerFunction    // 4. Execute controller
);
```

---

## 📦 Dependencies

### Core Dependencies (package.json)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "dotenv": "^16.0.3",
  "express-rate-limit": "^6.7.0",
  "express-mongo-sanitize": "^2.2.0",
  "express-validator": "^7.0.0",
  "nodemailer": "^6.9.0",
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.1",
  "pdfkit": "^0.13.0"
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```
Cause: MONGO_URI incorrect or MongoDB Atlas whitelist
Fix: Check .env MONGO_URI, whitelist 0.0.0.0/0 in Atlas
```

#### 2. JWT Token Invalid
```
Cause: Token expired or JWT_SECRET mismatch
Fix: Check JWT_SECRET in .env, regenerate token
```

#### 3. Rate Limit Exceeded
```
Cause: Too many requests
Fix: Wait 15 minutes, check rate limiter config
```

#### 4. CORS Error
```
Cause: Frontend URL not in CORS whitelist
Fix: Update FRONTEND_URL in backend .env
```

#### 5. 2FA Code Invalid
```
Cause: Clock skew or wrong code
Fix: Ensure server time is synchronized, use backup codes
```

---

## 🚀 Deployment

### Deploy to Render
```yaml
# render.yaml
services:
  - type: web
    name: bank-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: PORT
        value: 5000
```

---

## 📚 File Dependencies

### Entry Point Chain
```
server.js
  → config/database.js (MongoDB connection)
  → middleware/security.js (rate limiting, CORS)
  → routes/index.js
    → controllers (auth, account, transaction, loan, customer, admin)
      → models/index.js (MongoDB schemas)
      → utils/helpers.js (utilities)
      → services (OTP, 2FA)
```

### Request Flow
```
Client Request
  → Security Middleware (helmet, CORS, sanitize)
  → Rate Limiter
  → JWT Verification (auth.js)
  → Route Handler
    → Controller
      → Model
        → MongoDB
      ← Response
    ← Controller
  ← Route Handler
← Client Response
```

---

## 🎓 Learning Objectives

After understanding this backend implementation, you should know:

1. **Express.js Framework**
   - Middleware composition
   - Route organization
   - Error handling
   - Request validation

2. **MongoDB & Mongoose**
   - Schema design
   - CRUD operations
   - Aggregation pipelines
   - Indexing
   - Transactions

3. **Authentication & Security**
   - JWT implementation
   - Password hashing
   - 2FA (TOTP)
   - Rate limiting
   - Input sanitization
   - Security headers

4. **API Design**
   - RESTful endpoints
   - Request/response formats
   - Pagination
   - Error handling
   - API versioning

5. **Business Logic**
   - Transaction processing
   - Loan management
   - Account operations
   - Audit logging
   - Notification system

---

**Document Version:** 2.0  
**Last Updated:** March 28, 2026  
**Maintainer:** Bank Management System Team  
**Purpose:** AI-Ready Reconstruction Documentation
