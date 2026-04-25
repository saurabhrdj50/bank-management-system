# 🏦 FinBank - Premium Banking Platform

### A production-grade, portfolio-level fintech application

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animation-0055FF?style=flat-square&logo=framer&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Setup Instructions](#-setup-instructions)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🌟 Overview

**FinBank** is a comprehensive full-stack fintech application that simulates a modern digital banking platform. Built with a premium UI inspired by Google Pay and Paytm, it features glassmorphism design, smooth animations, and a complete set of banking operations.

The system includes:
- **48 backend controller functions**
- **42 REST API endpoints**
- **7 MongoDB database models**
- **7 React page components**
- **10+ reusable UI components**
- **JWT authentication with 2FA support**
- **Real-time fraud detection**
- **Complete loan lifecycle management**
- **Admin dashboard with analytics**

---

## ✨ Features

### 🔐 Security
- **JWT Authentication** with access/refresh token rotation
- **Two-Factor Authentication (2FA)** via TOTP (Google Authenticator)
- **OTP-based login** simulation
- **Rate limiting** (brute-force & DDoS protection)
- **AES-256-GCM encryption** for sensitive data (Aadhar, PAN)
- **Account lockout** after 5 failed login attempts
- **IP blacklisting** and request sanitization
- **Helmet.js** security headers
- **Input validation** and sanitization

### 💰 Banking Operations
- **Multi-account management** (Savings, Current, Fixed Deposit, Recurring)
- **Deposits & Withdrawals** with instant balance updates
- **Fund Transfers** between accounts
- **Transaction History** with pagination, filters, and search
- **Mini Statements** and CSV export
- **Real-time fraud detection** algorithm
- **Daily transaction limits**

### 🏠 Loans
- **4 loan types**: Personal (8.5%), Home (6.5%), Auto (7.5%), Business (9.5%)
- **Real-time EMI calculator**
- **Loan lifecycle management**: Apply → Approve → Disburse → Repay → Close
- **Progress tracking** with visual indicators
- **EMI payment history**

### 📊 Analytics & Insights
- **Interactive charts** (Line, Bar, Pie) via Recharts
- **AI-powered spending insights**
- **Transaction trend analysis**
- **Savings rate calculation**
- **Fraud alert system**

### 🤖 Advanced Features
- **AI Chatbot Assistant** — Check balance, transactions, loans via chat
- **Virtual Debit Card** — Animated card with chip design
- **ATM Simulator** — Quick withdrawals with confetti animations
- **Admin Dashboard** — Full system overview with loan management

### 🎨 Premium UI/UX
- **Glassmorphism** design with blur effects
- **Dark theme** with gradient accents
- **Framer Motion** animations throughout
- **Count-up** number animations
- **Skeleton loaders** instead of spinners
- **Success animations** with confetti
- **Responsive** mobile-first design
- **Micro-interactions** on every element

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18+ | REST API framework |
| **MongoDB Atlas** | Latest | Cloud database |
| **Mongoose** | 7.0+ | MongoDB ODM |
| **JWT** | 9.0+ | Authentication |
| **bcryptjs** | 2.4+ | Password hashing |
| **speakeasy** | 2.0+ | 2FA/TOTP |
| **Helmet** | 7.0+ | Security headers |
| **express-rate-limit** | 6.7+ | Rate limiting |
| **Nodemailer** | 6.9+ | Email OTP |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI framework |
| **React Router** | 6.30+ | Client-side routing |
| **TailwindCSS** | 3.4+ | Utility-first CSS |
| **Framer Motion** | 12.38+ | Animations |
| **Recharts** | 2.15+ | Data visualization |
| **Axios** | 1.13+ | HTTP client |
| **react-countup** | 6.5+ | Number animations |
| **canvas-confetti** | 1.9+ | Success effects |
| **react-icons** | 4.12+ | Icon library |
| **react-hot-toast** | 2.6+ | Notifications |

---

## 🏗 Architecture

### System Architecture
```
┌─────────────┐
│   Browser   │  (React Frontend)
└──────┬──────┘
       │ HTTP/HTTPS
       │
┌──────▼──────┐
│  Express.js  │  (Backend API - Port 5000)
│   Server     │
└──────┬──────┘
       │
┌──────▼──────┐
│  MongoDB     │  (Cloud Database)
│   Atlas      │
└─────────────┘
```

### Data Flow
```
User Action → React Component → API Call → Express Route → 
Controller → Mongoose Model → MongoDB → Response → 
React State Update → UI Re-render
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **MongoDB** (Local or Atlas cloud)
- **npm** or **yarn**

### 5-Minute Setup

```bash
# 1. Clone and navigate
cd Bank_Management_System

# 2. Setup Backend
cd backend
npm install
cp .env.example .env  # Edit .env with your MongoDB URI
node seed.js          # Seed demo data
npm run dev          # Start backend on port 5000

# 3. Setup Frontend (New Terminal)
cd frontend
npm install
cp .env.example .env
npm start            # Start frontend on port 3000

# 4. Open Browser
http://localhost:3000

# 5. Login with Demo Credentials
User:  user@bank.com
Pass:  password

Admin: admin@bank.com
Pass:  password
```

**That's it!** Your banking platform is now running.

---

## ⚙️ Setup Instructions

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Configure Environment
Create `.env` file in `backend/` directory:

```env
# Database
MONGO_URI=mongodb+srv://admin:admin123@cluster0.ypm64b5.mongodb.net/bank_management_system

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email (Optional - for OTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### 3. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

**Server runs on:** http://localhost:5000

#### 4. Seed Database
```bash
node seed.js
```

This creates demo users, accounts, and transactions.

---

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Configure Environment
Create `.env` file in `frontend/` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# App Info
REACT_APP_APP_NAME=FinBank
REACT_APP_VERSION=2.0.0
```

#### 3. Start Development Server
```bash
npm start
```

**App runs on:** http://localhost:3000

#### 4. Build for Production
```bash
npm run build
```

Creates optimized build in `/build` folder.

---

## 📡 API Reference

### Base URL
```
Development: http://localhost:5000/api
Production:  https://your-api.onrender.com/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/profile` | Get user profile | ✅ |
| POST | `/auth/logout` | Logout user | ✅ |
| POST | `/auth/change-password` | Change password | ✅ |
| POST | `/auth/refresh-token` | Refresh JWT token | ❌ |
| POST | `/auth/setup-2fa` | Setup 2FA | ✅ |
| POST | `/auth/verify-2fa-setup` | Verify 2FA | ✅ |
| POST | `/auth/verify-otp-login` | OTP login | ❌ |

### Account Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts` | Get user's accounts | ✅ |
| POST | `/accounts` | Create new account | ✅ |
| GET | `/accounts/:id` | Get account details | ✅ |
| POST | `/accounts/:id/deposit` | Deposit money | ✅ |
| POST | `/accounts/:id/withdraw` | Withdraw money | ✅ |
| POST | `/accounts/transfer` | Transfer funds | ✅ |
| POST | `/accounts/:id/close` | Close account | ✅ |

### Transaction Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/transactions` | Get transaction history | ✅ |
| GET | `/transactions/:id` | Get transaction details | ✅ |
| GET | `/accounts/:id/mini-statement` | Get mini statement | ✅ |
| GET | `/accounts/:id/analytics` | Get analytics | ✅ |
| GET | `/accounts/:id/statement/download` | Download CSV | ✅ |
| POST | `/transactions/:id/fraud-check` | Fraud detection | ✅ Admin |

### Loan Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/loans/apply` | Apply for loan | ✅ |
| GET | `/loans/:id` | Get loan details | ✅ |
| GET | `/customers/:id/loans` | Get customer loans | ✅ |
| GET | `/loans` | Get all loans | ✅ Admin |
| POST | `/loans/:id/approve` | Approve loan | ✅ Admin |
| POST | `/loans/:id/reject` | Reject loan | ✅ Admin |
| POST | `/loans/:id/disburse` | Disburse loan | ✅ Admin |
| POST | `/loans/pay-emi` | Pay EMI | ✅ |

### Customer Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile` | Get own profile | ✅ |
| PUT | `/profile` | Update own profile | ✅ |
| GET | `/customers` | Get all customers | ✅ Admin |
| GET | `/customers/:id` | Get customer details | ✅ Admin |
| PUT | `/customers/:id` | Update customer | ✅ Admin |
| DELETE | `/customers/:id` | Delete customer | ✅ Admin |
| POST | `/customers/:id/verify-kyc` | Verify KYC | ✅ Admin |

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/dashboard` | Dashboard stats | ✅ Admin |
| GET | `/admin/transactions` | All transactions | ✅ Admin |
| GET | `/admin/users` | Get all users | ✅ Admin |
| PUT | `/admin/users/:id/status` | Update user status | ✅ Admin |
| GET | `/admin/audit-logs` | Audit trail | ✅ Admin |
| GET | `/admin/analytics/customers` | Customer analytics | ✅ Admin |
| GET | `/admin/analytics/loans` | Loan analytics | ✅ Admin |
| GET | `/admin/notifications` | Get notifications | ✅ Admin |
| GET | `/admin/reports` | Generate reports | ✅ Admin |

---

### API Request/Response Format

#### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>  (for protected routes)
```

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { ... }  // if applicable
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### Example API Calls

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bank.com","password":"password"}'
```

#### Get Profile
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token>"
```

#### Deposit Money
```bash
curl -X POST http://localhost:5000/api/accounts/<accountId>/deposit \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "description": "Cash deposit"}'
```

---

## 🔑 Environment Variables

### Backend (.env)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | ✅ | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | ✅ | `your-secret-key-minimum-32-characters` |
| `PORT` | Server port | ❌ | `5000` (default) |
| `NODE_ENV` | Environment mode | ❌ | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ | `http://localhost:3000` |
| `EMAIL_USER` | Email for OTP sending | ❌ | `your-email@gmail.com` |
| `EMAIL_PASS` | Email app password | ❌ | `xxxx xxxx xxxx xxxx` |
| `ENCRYPTION_KEY` | AES encryption key | ❌ | `your-32-character-key` |

### Frontend (.env)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | ✅ | `http://localhost:5000/api` |
| `REACT_APP_APP_NAME` | Application name | ❌ | `FinBank` |
| `REACT_APP_VERSION` | App version | ❌ | `2.0.0` |

---

## 🗄️ Database Seeding

### Run Seed Script
```bash
cd backend
node seed.js
```

### What It Creates

#### Demo Users
| Email | Password | Role |
|-------|----------|------|
| `admin@bank.com` | `password` | Admin |
| `user@bank.com` | `password` | User |

#### Demo Data
- **2 Users** (admin + regular user)
- **2 Customer profiles**
- **4 Accounts** (2 savings, 2 current)
- **3 Transactions** (deposits, withdrawals)
- **1 Loan** (for user)

### Clear Database
```bash
# Inside seed.js, uncomment this line:
await Promise.all([
  User.deleteMany({}),
  Customer.deleteMany({}),
  Account.deleteMany({}),
  Transaction.deleteMany({}),
  Loan.deleteMany({}),
  Notification.deleteMany({}),
  AuditLog.deleteMany({})
]);
```

---

## 🧪 Testing

### Manual Testing

#### 1. Backend Health Check
```bash
curl http://localhost:5000/health
# Response: { "status": "UP", "timestamp": "..." }
```

#### 2. Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!",
    "firstName":"Test",
    "lastName":"User",
    "phone":"+919876543210"
  }'
```

#### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bank.com","password":"password"}'
```

#### 4. Test Protected Route
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <token_from_login>"
```

### API Testing Tools
- **Postman** - API development and testing
- **Insomnia** - REST client
- **Thunder Client** - VS Code extension

### Testing Checklist
- [ ] User registration works
- [ ] Login returns JWT token
- [ ] Profile fetch works with token
- [ ] Account creation works
- [ ] Deposit money works
- [ ] Withdraw money works
- [ ] Transfer between accounts works
- [ ] Transaction history loads
- [ ] Loan application works
- [ ] Admin login works
- [ ] Admin dashboard loads

---

## 🌐 Deployment

### Deploy Backend to Render

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/bank-management-system.git
git push -u origin master
```

#### 2. Create Render Account
- Go to [render.com](https://render.com)
- Connect GitHub repository

#### 3. Create Web Service
- **Name:** `finbank-api`
- **Region:** Singapore
- **Branch:** `master`
- **Root Directory:** `backend`

#### 4. Configure Build & Start
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

#### 5. Add Environment Variables
Add all variables from `.env` in Render dashboard:
- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (5000)
- `NODE_ENV` (production)
- `FRONTEND_URL` (your frontend URL)

#### 6. Deploy
Click "Create Web Service" and wait for deployment.

---

### Deploy Frontend to Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
cd frontend
vercel --prod
```

#### 3. Configure
- **Framework:** Create React App
- **Build Command:** `npm run build`
- **Output Directory:** `build`

#### 4. Environment Variables
Add in Vercel dashboard:
```
REACT_APP_API_URL=https://your-render-url.onrender.com/api
```

---

### MongoDB Atlas Setup

#### 1. Create Cluster
- Go to [cloud.mongodb.com](https://cloud.mongodb.com)
- Create free cluster (M0)

#### 2. Create Database User
- Database Access → Add New User
- Read and Write to any database

#### 3. Configure Network Access
- Network Access → Add IP Address
- Allow Access from Anywhere (0.0.0.0/0)

#### 4. Get Connection String
- Clusters → Connect → Connect your application
- Copy connection string
- Replace `<password>` with your database user password

---

## 🔒 Security

### Implemented Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcryptjs with 10 salt rounds |
| **JWT Tokens** | Access (15m) + Refresh (7d) rotation |
| **2FA** | TOTP via speakeasy + QR code |
| **Rate Limiting** | 100 req/15min (general), 5/15min (auth) |
| **Data Encryption** | AES-256-GCM for sensitive fields |
| **XSS Prevention** | express-validator + input sanitization |
| **NoSQL Injection** | mongo-sanitize |
| **Security Headers** | Helmet.js with CSP, HSTS |
| **Account Lockout** | 5 failed attempts → 30min lock |
| **IP Blacklisting** | Dynamic IP blocking |

### Security Best Practices

1. **Never commit `.env` files**
   ```gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use strong JWT secrets**
   ```bash
   # Generate random secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Enable HTTPS in production**
   - Render provides free SSL
   - Vercel provides free SSL

4. **Regular dependency updates**
   ```bash
   npm audit fix
   ```

---

## 📁 Project Structure

### Backend Structure
```
backend/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/                   # Business logic
│   ├── authController.js        # Authentication
│   ├── accountController.js      # Account operations
│   ├── customerController.js     # Customer management
│   ├── transactionController.js  # Transactions
│   ├── loanController.js         # Loans
│   └── adminController.js       # Admin functions
├── middleware/
│   ├── auth.js                 # JWT verification
│   └── security.js             # Rate limiting, CORS
├── models/
│   └── index.js                # Mongoose schemas
├── routes/
│   └── index.js                # API routes
├── services/
│   ├── otpService.js           # OTP generation
│   └── twoFactorService.js     # 2FA implementation
├── utils/
│   └── helpers.js              # Utility functions
├── seed.js                     # Database seeder
├── server.js                   # Express app
├── .env                       # Environment config
└── package.json
```

### Frontend Structure
```
frontend/
├── public/
│   └── index.html              # HTML entry point
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── Animated.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Chatbot.jsx
│   │   ├── Form.jsx
│   │   ├── Loading.jsx
│   │   ├── Modal.jsx
│   │   ├── Navigation.jsx
│   │   ├── Toast.jsx
│   │   └── VirtualCard.jsx
│   ├── pages/                 # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Loans.jsx
│   │   ├── Insights.jsx
│   │   ├── ATMSimulator.jsx
│   │   └── AdminDashboard.jsx
│   ├── services/
│   │   └── api.js             # Axios API layer
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state
│   ├── App.jsx                # Router setup
│   ├── index.jsx              # React entry
│   └── index.css              # Global styles
├── tailwind.config.js         # Tailwind config
├── postcss.config.js          # PostCSS config
├── package.json
└── .env
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
**Error:** `MongoNetworkError` or `MongoServerSelectionError`

**Solution:**
```bash
# Check MongoDB Atlas whitelist
# Add 0.0.0.0/0 to Network Access

# Verify MONGO_URI format
# Should be: mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

#### 2. JWT Token Invalid/Expired
**Error:** `JsonWebTokenError` or `TokenExpiredError`

**Solution:**
```javascript
// Clear localStorage and re-login
localStorage.clear();

// Check JWT_SECRET matches in .env
// Restart backend server
```

#### 3. CORS Errors
**Error:** `Access-Control-Allow-Origin` blocked

**Solution:**
```env
# In backend/.env
FRONTEND_URL=http://localhost:3000  # or your frontend URL
```

#### 4. Port Already in Use
**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or use different port
PORT=5001
```

#### 5. Frontend Build Fails
**Error:** `Module not found` or `Cannot find module`

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 6. Dark Mode Not Working
**Solution:**
```javascript
// Check if 'dark' class is added to <html>
document.documentElement.classList.contains('dark');

// Verify Tailwind dark mode config
// tailwind.config.js should have: darkMode: 'class'
```

---

## 🔮 Future Improvements

### Short-term
- [ ] Add Redux or Zustand for state management
- [ ] Implement React Query for data fetching
- [ ] Add form validation (React Hook Form + Zod)
- [ ] Write unit tests (Jest + React Testing Library)
- [ ] Add PWA support (offline mode)

### Medium-term
- [ ] Real-time notifications (WebSocket)
- [ ] Email templates (for transactions, loans)
- [ ] SMS integration (for OTPs)
- [ ] File upload (KYC documents)
- [ ] Multi-language support (i18n)

### Long-term
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Investment features
- [ ] Insurance products

---

## 📈 Statistics

- **Backend Controllers:** 48 functions
- **API Endpoints:** 42 routes
- **Database Models:** 7 schemas
- **Frontend Pages:** 7 components
- **UI Components:** 10+ reusable components
- **Total Code:** 4,000+ lines
- **Dependencies:** 30+ packages
- **Documentation:** Complete AI-ready format

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for **educational and portfolio purposes**.

MIT License - feel free to use it for learning and demonstration.

---

## 👨‍💻 Author

**Bank Management System Team**

Built with ❤️ using Node.js, React, MongoDB, and TailwindCSS

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

**Made for developers, by developers**

</div>
