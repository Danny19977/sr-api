import axios from 'axios';

// This is your API base configuration
// The URL comes from environment variables (see .env file)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001/api';
const API_TIMEOUT = process.env.REACT_APP_API_TIMEOUT || 10000;
const DEBUG_API = process.env.REACT_APP_DEBUG_API === 'true';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Note: Removed withCredentials as backend now uses JWT tokens instead of cookies
});

// Request interceptor - runs before every request
api.interceptors.request.use(
  (config) => {
    // Add JWT token to Authorization header for all requests
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (DEBUG_API) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
      if (token) {
        console.log('🔐 Using Bearer token for authentication');
      }
    }
    return config;
  },
  (error) => {
    if (DEBUG_API) {
      console.error('❌ Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor - runs after every response
api.interceptors.response.use(
  (response) => {
    if (DEBUG_API) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (DEBUG_API) {
      console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken');
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
