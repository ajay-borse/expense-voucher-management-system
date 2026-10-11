import axios from 'axios';

/**
 * Centralized Axios instance configured for Expense Voucher API.
 * Uses environment variable VITE_API_URL or defaults to localhost backend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Attach JWT Bearer token if present in localStorage.
 */
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // LocalStorage access may fail in restricted browser contexts
      console.warn('Unable to access localStorage for token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * - Handles 401 Unauthorized globally by clearing session and redirecting to /login
 * - Avoids redirect loops when the 401 originates from /auth/login
 * - Preserves session on 400, 403, 404, 409 or network timeouts
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    const requestUrl = error.config ? error.config.url || '' : '';

    // Handle 401 Unauthorized (expired or invalid token)
    if (status === 401) {
      // Do not redirect if the failure is an intentional invalid password on /auth/login
      const isLoginEndpoint = requestUrl.includes('/auth/login');
      if (!isLoginEndpoint) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) {
          console.warn('Failed to clear localStorage on 401:', e);
        }

        // Only redirect if not already on the login page to prevent loops
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }

    // Pass through error to caller for specific handling (e.g. form validation errors)
    return Promise.reject(error);
  }
);

export default api;
