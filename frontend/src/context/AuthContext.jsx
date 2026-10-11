import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  // Initialize authentication state on application startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken) {
          setLoading(false);
          return;
        }

        setToken(storedToken);

        // Pre-populate with cached user for faster UI paint
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (parseErr) {
            console.warn('Failed to parse cached user:', parseErr);
          }
        }

        // Validate session with live backend endpoint
        const response = await api.get('/auth/me');
        if (response.data?.success && response.data?.data) {
          const liveUser = response.data.data;
          setUser(liveUser);
          localStorage.setItem('user', JSON.stringify(liveUser));
          setNetworkError(false);
        }
      } catch (err) {
        const status = err.response ? err.response.status : null;
        if (status === 401) {
          // Explicit token expiration or invalid signature
          console.warn('Stored token is invalid or expired. Clearing session.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        } else if (!err.response) {
          // Network error or backend temporarily offline
          console.warn('Backend server is unreachable during auth initialization:', err.message);
          setNetworkError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Log in user with credentials.
   * Updates state and saves session to localStorage.
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data?.data;

      if (!payload) {
        throw new Error('Malformed response from authentication server');
      }

      const receivedToken = payload.accessToken || payload.token;
      const receivedUser = payload.user;

      if (!receivedToken || !receivedUser) {
        throw new Error('Authentication response is missing token or user data');
      }

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);
      setNetworkError(false);

      return { success: true, user: receivedUser, token: receivedToken };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Invalid email or password'
          : err.message || 'Login failed. Please try again.');
      throw new Error(message);
    }
  }, []);

  /**
   * Log out user.
   * Clears tokens and resets authentication state.
   */
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.warn('Failed to clear session storage:', err);
    }
    setUser(null);
    setToken(null);
    setNetworkError(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        networkError,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
