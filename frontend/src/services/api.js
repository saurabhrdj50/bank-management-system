import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const newToken = res.data.token || res.data.accessToken;
          localStorage.setItem('token', newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
};

export const customerAPI = {
  getAll: (page = 1, limit = 10) => api.get('/customers', { params: { page, limit } }),
  getById: (id) => api.get(`/customers/${id}`),
  getProfile: () => api.get('/auth/profile'),
  update: (id, data) => api.put(`/customers/${id}`, data),
  updateProfile: (data) => api.put('/profile', data),
  delete: (id) => api.delete(`/customers/${id}`),
  verifyKYC: (id, data) => api.post(`/customers/${id}/verify-kyc`, data),
};

export const accountAPI = {
  create: (data) => api.post('/accounts', data),
  getAll: () => api.get('/accounts'),
  getByCustomer: (customerId) => api.get(`/customers/${customerId}/accounts`),
  getById: (accountId) => api.get(`/accounts/${accountId}`),
  deposit: (accountId, data) => api.post(`/accounts/${accountId}/deposit`, data),
  withdraw: (accountId, data) => api.post(`/accounts/${accountId}/withdraw`, data),
  transfer: (data) => api.post('/accounts/transfer', data),
  closeAccount: (accountId) => api.post(`/accounts/${accountId}/close`),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getHistory: (accountId, params) => api.get(`/accounts/${accountId}/transactions`, { params }),
  getMiniStatement: (accountId) => api.get(`/accounts/${accountId}/mini-statement`),
  getAnalytics: (accountId, days = 30) => api.get(`/accounts/${accountId}/analytics`, { params: { days } }),
  getById: (transactionId) => api.get(`/transactions/${transactionId}`),
  detectFraud: (transactionId) => api.post(`/transactions/${transactionId}/fraud-check`),
  downloadStatement: (accountId, params) => api.get(`/accounts/${accountId}/statement/download`, { 
    params, responseType: 'blob'
  }),
};

export const loanAPI = {
  apply: (data) => api.post('/loans/apply', data),
  getByCustomer: (customerId, status = '') => api.get(`/customers/${customerId}/loans`, { params: { status } }),
  getAll: (page = 1, limit = 10, status = '') => api.get('/loans', { params: { page, limit, status } }),
  getById: (loanId) => api.get(`/loans/${loanId}`),
  approve: (loanId) => api.post(`/loans/${loanId}/approve`),
  reject: (loanId, data) => api.post(`/loans/${loanId}/reject`, data),
  disburse: (loanId) => api.post(`/loans/${loanId}/disburse`),
  payEMI: (data) => api.post('/loans/pay-emi', data),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  getCustomerAnalytics: (days = 30) => api.get('/admin/analytics/customers', { params: { days } }),
  getLoanAnalytics: () => api.get('/admin/analytics/loans'),
  getNotifications: (params) => api.get('/admin/notifications', { params }),
  generateReport: (params) => api.get('/admin/reports', { params }),
};

export default api;
