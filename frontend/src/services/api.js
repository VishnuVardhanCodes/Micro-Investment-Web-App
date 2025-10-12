import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (email, password) => api.post('/signup', { email, password }),
  login: (email, password) => api.post('/login', { email, password }),
};

// Transaction endpoints
export const transactionAPI = {
  create: (amount, description, nearest = 1) => 
    api.post('/transaction', { amount, description, nearest }),
  getAll: () => api.get('/transactions'),
  delete: (transactionId) => api.delete(`/transaction/${transactionId}`),
};

// Portfolio endpoints
export const portfolioAPI = {
  getOptions: () => api.get('/portfolio-options'),
  select: (portfolio_option_ids) => 
    api.post('/select-portfolio', { portfolio_option_ids }),
  getCurrent: () => api.get('/portfolio'),
  getInvestments: () => api.get('/investments'),
  getInvestmentsDetailed: () => api.get('/investments/detailed'),
  removeSelection: (option_id) => api.delete(`/portfolio-selection/${option_id}`),
  exitInvestment: (option_id) => api.post(`/investments/exit/${option_id}`),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () => api.get('/dashboard'),
  getMilestones: () => api.get('/milestones'),
};

// Payment endpoints
export const paymentAPI = {
  createOrder: (amount) => api.post('/create-order', { amount }),
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    api.post('/verify-payment', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
};

// Transfer endpoints
export const transferAPI = {
  create: (recipient_upi, recipient_mobile, recipient_name, amount, description, roundup_to_invest = null) =>
    api.post('/transfer', {
      recipient_upi,
      recipient_mobile,
      recipient_name,
      amount,
      description,
      roundup_to_invest,
    }),
  getAll: () => api.get('/transfers'),
};

// Wallet endpoints
export const walletAPI = {
  createOrder: (amount, description) =>
    api.post('/wallet/create-order', { amount, description }),
  verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature) =>
    api.post('/wallet/verify-payment', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    }),
  getBalance: () => api.get('/wallet'),
  getDeposits: () => api.get('/deposits'),
};

// Investment tracking
export const investmentAPI = {
  getSources: () => api.get('/investment-sources'),
  investRoundups: (amount, source = 'roundups') => api.post(`/invest-roundups?amount=${amount}&source=${source}`),
  updatePrices: () => api.post('/update-prices'),
};

export default api;
