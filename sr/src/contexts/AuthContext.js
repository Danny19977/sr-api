/*!

=========================================================
* TeamOnSite (TOS) - Authentication Context
=========================================================

* React context for managing authentication state
* Provides login, logout, and user state management

=========================================================

*/
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiServices';
import userActivityLogger from '../services/userActivityLogger';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a token in localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('❌ No JWT token found in localStorage');
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      
      // Try to get the current user from the backend
      const userData = await authService.getAuthUser();
      setUser(userData);
      setIsAuthenticated(true);
      console.log('✅ User is authenticated:', userData);
    } catch (error) {
      console.log('❌ User is not authenticated:', error.message);
      setUser(null);
      setIsAuthenticated(false);
      // Clear invalid token
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      // After successful login, get user data
      const userData = await authService.getAuthUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store login time for session duration tracking
      localStorage.setItem('loginTime', Date.now().toString());
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Log the login activity
      setTimeout(() => {
        userActivityLogger.logLogin(userData);
      }, 1000); // Small delay to ensure user context is set
      
      return { user: userData, ...response };
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      
      // Log failed login attempt
      userActivityLogger.logError(
        'login_failed',
        'Failed login attempt',
        { 
          email: credentials.email_or_phone,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      );
      
      // Enhance error message for better user experience
      if (error.response?.status === 401) {
        throw new Error('Email ou téléphone ou mot de passe incorrect');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        throw new Error('Erreur de connexion réseau');
      } else {
        throw new Error(error.message || 'Erreur de connexion');
      }
    }
  };

  const logout = async () => {
    try {
      // Log logout activity before clearing user data
      if (user) {
        userActivityLogger.logLogout(user);
      }
      
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state on logout
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      // Redirect to login
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
