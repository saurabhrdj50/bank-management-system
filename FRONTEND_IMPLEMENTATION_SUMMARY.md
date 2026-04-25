# Frontend Implementation Summary (AI-READY)

**Version:** 2.0.0  
**Last Updated:** March 28, 2026  
**Framework:** React 18 + TailwindCSS 3  
**Build Tool:** Create React App  
**Purpose:** Complete frontend reconstruction documentation for AI agents and developers

---

## 📂 Project Structure

```
frontend/
├── public/
│   └── index.html                    # HTML entry point with root div
│
├── src/
│   ├── index.jsx                     # React 18 entry point
│   ├── index.css                     # Global styles + Tailwind directives
│   ├── App.jsx                       # Main app with routing
│   │
│   ├── components/                   # Reusable UI components
│   │   ├── index.js                  # Barrel export file
│   │   ├── Animated.jsx              # CountUp, FadeIn, SlideIn, Stagger animations
│   │   ├── Button.jsx                # Button, IconButton, GradientButton
│   │   ├── Card.jsx                  # Card, CardHeader, CardBody, CardFooter, StatCard, GlassPanel
│   │   ├── Chatbot.jsx               # AI-powered chatbot assistant
│   │   ├── Form.jsx                  # Input, Select, Textarea, SearchInput
│   │   ├── Loading.jsx               # Loading, Skeleton, SkeletonCard, SkeletonTable, PageLoader
│   │   ├── Modal.jsx                 # Modal, AlertModal, SuccessModal
│   │   ├── Navigation.jsx             # Responsive navbar with dark mode
│   │   ├── Toast.jsx                 # Toast notification system
│   │   └── VirtualCard.jsx           # Animated virtual debit card
│   │
│   ├── pages/                        # Page components
│   │   ├── Login.jsx                 # Authentication (login + register)
│   │   ├── Dashboard.jsx             # User dashboard with charts
│   │   ├── Transactions.jsx          # Transaction history and management
│   │   ├── Loans.jsx                 # Loan application and management
│   │   ├── Insights.jsx              # AI-powered financial insights
│   │   ├── ATMSimulator.jsx          # Interactive ATM interface
│   │   └── AdminDashboard.jsx        # Admin panel with analytics
│   │
│   ├── services/                     # API integration layer
│   │   └── api.js                    # Axios instance with interceptors
│   │
│   ├── context/                      # React Context providers
│   │   └── AuthContext.jsx           # Authentication state management
│   │
│   └── hooks/                        # Custom React hooks (if any)
│
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── package.json                      # Dependencies and scripts
├── .env                              # Environment variables
└── .env.production                   # Production environment
```

---

## 🔐 Authentication Flow

### Login Process
```javascript
// Step 1: User enters credentials in Login.jsx
const handleLogin = async (credentials) => {
  const response = await authAPI.login(credentials);
  const { token, user } = response.data;
  
  // Step 2: Store token and user in localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Step 3: Update AuthContext
  login(user, token);
  
  // Step 4: Redirect to dashboard
  navigate('/dashboard');
};
```

### Token Handling
```javascript
// services/api.js - Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Protected Routes
```javascript
// App.jsx - ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();
  
  if (!token || !user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Usage in App.jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

---

## 🔄 Complete Frontend Execution Flow

### 1. Application Bootstrap
```
User opens browser → http://localhost:3000
├── index.html loads
├── React 18 renders App component
├── AuthContext initializes
│   ├── Checks localStorage for token
│   ├── Sets initial auth state
│   └── App.jsx renders routes
└── Navigation component appears
```

### 2. User Login Flow
```
Login Page (/login)
├── User enters email & password
├── Form validation (email format, password length)
├── POST /api/auth/login
├── Backend validates credentials
├── Backend returns { token, user }
├── Frontend stores in localStorage
├── AuthContext updates state
├── Redirect to /dashboard
└── Dashboard loads user data
```

### 3. Dashboard Data Loading
```
Dashboard Page (/dashboard)
├── AuthContext provides user & token
├── useEffect triggers data fetch
├── Parallel API calls:
│   ├── GET /api/auth/profile
│   ├── GET /api/accounts
│   └── GET /api/transactions?limit=5
├── Loading states display
├── Data populates UI:
│   ├── Welcome message with user name
│   ├── Account cards with balances
│   ├── Recent transactions list
│   └── Quick action buttons
└── User can interact with data
```

### 4. Transaction Operations
```
Transactions Page (/transactions)
├── User selects account
├── GET /api/transactions?accountId=X
├── Transaction list renders
├── User clicks Deposit/Withdraw/Transfer
├── Modal opens with form
├── User enters amount & details
├── POST /api/accounts/:id/deposit
├── Backend processes transaction
├── Success toast displays
├── Balance updates automatically
└── Transaction list refreshes
```

### 5. Loan Application
```
Loans Page (/loans)
├── GET /api/customers/:customerId/loans
├── User clicks "Apply for Loan"
├── EMI Calculator modal opens
├── User enters amount & tenure
├── Real-time EMI calculation
├── User submits application
├── POST /api/loans/apply
├── Backend creates loan (status: pending)
├── Success notification displays
└── Loan appears in list (pending)
```

### 6. Admin Dashboard
```
Admin Dashboard (/admin)
├── ProtectedRoute checks admin role
├── GET /api/admin/dashboard
├── GET /api/admin/transactions
├── GET /api/admin/loans
├── Admin sees:
│   ├── System statistics
│   ├── Pending loan applications
│   ├── All transactions
│   └── Customer analytics
├── Admin can approve/reject loans
├── POST /api/loans/:id/approve
└── System updates loan status
```

---

## 🌐 API Integration Layer

### Axios Configuration
```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Modules

#### 1. authAPI
```javascript
// services/api.js - authAPI module
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh-token'),
  setup2FA: () => api.post('/auth/setup-2fa'),
  verify2FASetup: (data) => api.post('/auth/verify-2fa-setup', data),
  verifyOTPLogin: (data) => api.post('/auth/verify-otp-login', data),
};
```

#### 2. accountAPI
```javascript
// services/api.js - accountAPI module
export const accountAPI = {
  create: (data) => api.post('/accounts', data),
  getAll: () => api.get('/accounts'),
  getById: (accountId) => api.get(`/accounts/${accountId}`),
  deposit: (accountId, data) => api.post(`/accounts/${accountId}/deposit`, data),
  withdraw: (accountId, data) => api.post(`/accounts/${accountId}/withdraw`, data),
  transfer: (data) => api.post('/accounts/transfer', data),
  close: (accountId) => api.post(`/accounts/${accountId}/close`),
};
```

#### 3. transactionAPI
```javascript
// services/api.js - transactionAPI module
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (transactionId) => api.get(`/transactions/${transactionId}`),
  getMiniStatement: (accountId) => 
    api.get(`/accounts/${accountId}/mini-statement`),
  getAnalytics: (accountId) => 
    api.get(`/accounts/${accountId}/analytics`),
  downloadStatement: (accountId) => 
    api.get(`/accounts/${accountId}/statement/download`, {
      responseType: 'blob'
    }),
};
```

#### 4. loanAPI
```javascript
// services/api.js - loanAPI module
export const loanAPI = {
  apply: (data) => api.post('/loans/apply', data),
  getByCustomer: (customerId) => 
    api.get(`/customers/${customerId}/loans`),
  getById: (loanId) => api.get(`/loans/${loanId}`),
  getAll: () => api.get('/loans'),
  approve: (loanId) => api.post(`/loans/${loanId}/approve`),
  reject: (loanId, reason) => 
    api.post(`/loans/${loanId}/reject`, { reason }),
  disburse: (loanId) => api.post(`/loans/${loanId}/disburse`),
  payEMI: (data) => api.post('/loans/pay-emi', data),
};
```

#### 5. customerAPI
```javascript
// services/api.js - customerAPI module
export const customerAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  getById: (customerId) => api.get(`/customers/${customerId}`),
};
```

#### 6. adminAPI
```javascript
// services/api.js - adminAPI module
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllTransactions: () => api.get('/admin/transactions'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (userId, status) => 
    api.put(`/admin/users/${userId}/status`, { status }),
  getCustomerAnalytics: () => 
    api.get('/admin/analytics/customers'),
  getLoanAnalytics: () => 
    api.get('/admin/analytics/loans'),
  getNotifications: () => api.get('/admin/notifications'),
  generateReport: (params) => 
    api.get('/admin/reports', { params, responseType: 'blob' }),
};
```

---

## 📊 State Management

### AuthContext Structure
```javascript
// context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const value = { user, token, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### Local Component State
```javascript
// Example: Dashboard.jsx
const Dashboard = () => {
  const { user, token } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user.customerId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [accountsRes, profileRes] = await Promise.all([
        accountAPI.getAll(),
        customerAPI.getProfile()
      ]);
      
      setAccounts(accountsRes.data.data || []);
      setUser(profileRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (/* JSX */);
};
```

---

## 🗺️ Routing System

### Route Configuration (App.jsx)
```javascript
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/loans" element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          } />
          <Route path="/insights" element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          } />
          <Route path="/atm" element={
            <ProtectedRoute>
              <ATMSimulator />
            </ProtectedRoute>
          } />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Default Redirect */}
          <Route path="/" element={
            <Navigate to="/dashboard" replace />
          } />
          
          {/* 404 Handler */}
          <Route path="*" element={
            <Navigate to="/dashboard" replace />
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Route Hierarchy
```
/ (root)
├── /login                    # Public - Login/Register
├── /register                 # Public - Register
├── /dashboard                # Protected - User dashboard
├── /transactions             # Protected - Transaction history
├── /loans                    # Protected - Loan management
├── /insights                 # Protected - Financial insights
├── /atm                      # Protected - ATM simulator
├── /admin                    # Protected - Admin dashboard
└── /*                        # Redirect to /dashboard
```

---

## 🎨 Component Hierarchy

### Main Layout Structure
```
App.jsx
└── AuthProvider
    └── BrowserRouter
        └── Navigation (sticky header)
            └── Routes
                ├── /login
                │   └── Login Page
                │       ├── Login Form
                │       ├── Register Form (toggle)
                │       └── Demo Credentials Card
                │
                ├── /dashboard
                │   └── Dashboard Page
                │       ├── Welcome Header
                │       ├── Summary Cards
                │       ├── Account Cards Grid
                │       ├── Recent Transactions List
                │       └── Quick Actions Modal
                │
                ├── /transactions
                │   └── Transactions Page
                │       ├── Account Selector Grid
                │       ├── Transaction Filters
                │       ├── Transaction Table
                │       ├── Pagination Controls
                │       └── Action Modals
                │
                ├── /loans
                │   └── Loans Page
                │       ├── Loan Summary
                │       ├── Apply Button
                │       ├── EMI Calculator Modal
                │       └── Loan Cards Grid
                │
                ├── /insights
                │   └── Insights Page
                │       ├── Spending Chart
                │       ├── AI Insights List
                │       └── Analytics Cards
                │
                ├── /atm
                │   └── ATMSimulator Page
                │       ├── Account Selection
                │       ├── ATM Interface
                │       ├── Amount Buttons
                │       └── Success Animation
                │
                └── /admin
                    └── AdminDashboard Page
                        ├── Tab Navigation
                        ├── Overview Tab
                        ├── Loans Tab
                        └── Transactions Tab
```

### Component Breakdown

#### UI Components (src/components/)
1. **Animated.jsx** - Animation utilities
   - `CountUp` - Animated number counter
   - `FadeIn` - Fade in animation
   - `SlideIn` - Slide in from direction
   - `Stagger` - Staggered list animation

2. **Button.jsx** - Button variants
   - `Button` - Primary/Secondary/Danger/Success/Outline
   - `IconButton` - Icon-only buttons
   - `GradientButton` - Gradient background

3. **Card.jsx** - Card containers
   - `Card` - Basic card with hover
   - `CardHeader` - Card header with icon
   - `CardBody` - Card content area
   - `CardFooter` - Card actions
   - `StatCard` - Stats display
   - `GlassPanel` - Glassmorphism effect

4. **Form.jsx** - Form inputs
   - `Input` - Text input with label
   - `Select` - Dropdown select
   - `Textarea` - Multi-line text
   - `SearchInput` - Search with icon

5. **Loading.jsx** - Loading states
   - `Loading` - Full page loader
   - `Skeleton` - Content placeholder
   - `SkeletonCard` - Card skeleton
   - `SkeletonTable` - Table skeleton
   - `PageLoader` - Page-level loader

6. **Modal.jsx** - Modal dialogs
   - `Modal` - Reusable modal
   - `AlertModal` - Alert dialogs
   - `SuccessModal` - Success feedback

7. **Toast.jsx** - Notifications
   - `Toast` - Toast notification
   - `ToastContainer` - Toast container
   - `useToast` - Toast hook

8. **Navigation.jsx** - Navigation bar
   - Logo and branding
   - Dark mode toggle
   - Mobile menu
   - User dropdown

9. **Chatbot.jsx** - AI assistant
   - Chat interface
   - AI responses
   - Quick actions

10. **VirtualCard.jsx** - Virtual card
    - Animated card display
    - Card details

#### Page Components (src/pages/)
1. **Login.jsx** - Authentication
2. **Dashboard.jsx** - Main dashboard
3. **Transactions.jsx** - Transactions
4. **Loans.jsx** - Loan management
5. **Insights.jsx** - Financial insights
6. **ATMSimulator.jsx** - ATM interface
7. **AdminDashboard.jsx** - Admin panel

---

## 📡 Page → API Mapping

| Page | API Endpoint | Method | Purpose |
|------|-------------|--------|---------|
| **Login** | `/api/auth/login` | POST | User login |
| **Login** | `/api/auth/register` | POST | User registration |
| **Dashboard** | `/api/auth/profile` | GET | Get user profile |
| **Dashboard** | `/api/accounts` | GET | Get user accounts |
| **Dashboard** | `/api/transactions` | GET | Recent transactions |
| **Dashboard** | `/api/accounts` | POST | Create new account |
| **Transactions** | `/api/accounts` | GET | Get all accounts |
| **Transactions** | `/api/transactions` | GET | Transaction history |
| **Transactions** | `/api/accounts/:id/deposit` | POST | Deposit money |
| **Transactions** | `/api/accounts/:id/withdraw` | POST | Withdraw money |
| **Transactions** | `/api/accounts/transfer` | POST | Transfer money |
| **Loans** | `/api/loans/apply` | POST | Apply for loan |
| **Loans** | `/api/customers/:id/loans` | GET | Get customer loans |
| **Loans** | `/api/loans/:id/approve` | POST | Approve loan |
| **Loans** | `/api/loans/:id/reject` | POST | Reject loan |
| **Insights** | `/api/accounts/:id/analytics` | GET | Transaction analytics |
| **Admin** | `/api/admin/dashboard` | GET | Dashboard stats |
| **Admin** | `/api/admin/transactions` | GET | All transactions |
| **Admin** | `/api/admin/loans` | GET | All loans |
| **Admin** | `/api/admin/users` | GET | All users |

---

## 🛠️ Error Handling Flow

### Global Error Handling
```javascript
// services/api.js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('Access denied');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      toast.error('Resource not found');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);
```

### Component-Level Error Handling
```javascript
// Example: Dashboard.jsx
const loadDashboardData = async () => {
  try {
    const response = await Promise.all([
      customerAPI.getProfile(),
      accountAPI.getAll(),
    ]);
    
    setProfile(response[0].data.data);
    setAccounts(response[1].data.data);
  } catch (error) {
    console.error('Dashboard load error:', error);
    
    if (error.response?.status === 401) {
      // Token expired
      logout();
    } else if (error.response?.status === 404) {
      toast.error('Profile not found');
    } else {
      toast.error('Failed to load dashboard data');
    }
  }
};
```

---

## 🧩 Environment Variables

### Development (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FinBank (Dev)
REACT_APP_VERSION=2.0.0
```

### Production (.env.production)
```
REACT_APP_API_URL=https://finbank-api.onrender.com/api
REACT_APP_APP_NAME=FinBank
REACT_APP_VERSION=2.0.0
GENERATE_SOURCEMAP=false
```

---

## 📦 Dependencies

### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.3",
  "react-scripts": "5.0.1",
  "axios": "^1.13.6"
}
```

### UI & Animation
```json
{
  "tailwindcss": "^3.4.19",
  "framer-motion": "^12.38.0",
  "react-icons": "^4.12.0",
  "react-hot-toast": "^2.6.0",
  "react-countup": "^6.5.3",
  "canvas-confetti": "^1.9.4",
  "recharts": "^2.15.4"
}
```

### Dev Dependencies
```json
{
  "autoprefixer": "^10.4.27",
  "postcss": "^8.5.8"
}
```

---

## 🎯 Key Implementation Patterns

### 1. Data Fetching Pattern
```javascript
// Pattern for fetching data with loading state
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/endpoint');
      setData(response.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### 2. Form Submission Pattern
```javascript
// Pattern for form submission
const handleSubmit = async (formData) => {
  try {
    setSubmitting(true);
    const response = await api.post('/endpoint', formData);
    toast.success('Success message');
    onSuccess(response.data);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Error message');
  } finally {
    setSubmitting(false);
  }
};
```

### 3. Modal State Pattern
```javascript
// Pattern for managing modal state
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState(null);

const openModal = (item) => {
  setSelectedItem(item);
  setIsModalOpen(true);
};

const closeModal = () => {
  setSelectedItem(null);
  setIsModalOpen(false);
};
```

### 4. Pagination Pattern
```javascript
// Pattern for pagination
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const loadPage = async (page) => {
  const response = await api.get(`/transactions?page=${page}`);
  setTransactions(response.data.data);
  setTotalPages(response.data.pagination.pages);
};

const handlePageChange = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages) {
    setCurrentPage(newPage);
    loadPage(newPage);
  }
};
```

---

## 🎨 Styling System

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... up to 900
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          // ... up to 900
        },
        surface: '#ffffff',
        'surface-dark': '#1e293b',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
```

### Dark Mode Implementation
```javascript
// Add 'dark' class to <html> element
// Toggle with button in Navigation
document.documentElement.classList.toggle('dark');

// Use dark: prefix in Tailwind classes
<div className="bg-white dark:bg-slate-800">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

---

## 🚀 Build & Deployment

### Development Build
```bash
npm start
# Runs on http://localhost:3000
# Hot module replacement enabled
```

### Production Build
```bash
npm run build
# Creates optimized build in /build folder
# Minified and gzip compressed
```

### Deployment to Vercel
```bash
# vercel.json (optional)
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# Deploy command
vercel --prod
```

---

## ✅ Testing Checklist

### Frontend Testing
- [ ] Login with demo credentials
- [ ] Register new user
- [ ] Dashboard loads profile and accounts
- [ ] Create new account
- [ ] Deposit money
- [ ] Withdraw money
- [ ] Transfer between accounts
- [ ] View transaction history
- [ ] Apply for loan
- [ ] Pay EMI
- [ ] Dark mode toggle
- [ ] Mobile responsive layout
- [ ] Admin login
- [ ] Admin dashboard data
- [ ] Approve/reject loans (admin)

### API Integration Testing
- [ ] Token stored in localStorage
- [ ] Token sent in Authorization header
- [ ] 401 redirects to login
- [ ] Error toasts display
- [ ] Loading states show
- [ ] Data persists on refresh

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Token not sent with requests"
**Cause:** Axios interceptor not configured
**Fix:** Check services/api.js request interceptor

#### 2. "Dashboard shows empty data"
**Cause:** API response format mismatch
**Fix:** Verify response structure: `response.data.data`

#### 3. "CORS errors"
**Cause:** Backend not allowing frontend origin
**Fix:** Check backend CORS configuration

#### 4. "Build fails"
**Cause:** Missing dependencies
**Fix:** Run `npm install` in frontend folder

#### 5. "Dark mode not persisting"
**Cause:** localStorage not accessed
**Fix:** Check Navigation component useEffect

---

## 📚 File Dependencies

### Entry Point Chain
```
index.html
  → index.jsx
    → App.jsx
      → AuthContext.jsx
        → Routes
          → Pages
            → Components
              → api.js (Axios calls)
```

### API Data Flow
```
Component (useEffect)
  → API call (api.js)
    → Backend server (localhost:5000)
      → MongoDB database
        → Response back to component
          → Update state
            → Re-render UI
```

---

## 🎓 Learning Objectives

After understanding this frontend implementation, you should know:

1. **React 18 Patterns**
   - Functional components with hooks
   - Context API for global state
   - Effect hooks for side effects
   - Refs for DOM access

2. **React Router v6**
   - Route configuration
   - Protected routes
   - Programmatic navigation
   - URL parameters

3. **State Management**
   - Local component state
   - Context API pattern
   - localStorage integration
   - Form state management

4. **API Integration**
   - Axios configuration
   - Request/response interceptors
   - Error handling
   - Token management

5. **UI/UX Best Practices**
   - Responsive design
   - Dark mode support
   - Loading states
   - Error feedback
   - Accessibility

---

## 🚀 Future Enhancements

Potential improvements for the frontend:

1. **State Management** - Add Redux or Zustand
2. **Data Fetching** - Add React Query/SWR
3. **Forms** - Add form validation library (React Hook Form)
4. **Testing** - Add Jest and React Testing Library
5. **PWA** - Convert to Progressive Web App
6. **Charts** - Add more visualization options
7. **i18n** - Internationalization support
8. **Theming** - Multiple theme support

---

**Document Version:** 2.0  
**Last Updated:** March 28, 2026  
**Maintainer:** Bank Management System Team  
**Purpose:** AI-Ready Reconstruction Documentation
