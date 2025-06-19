// src/context/AuthContext.js - Fix to prevent role confusion
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/auth';

// Create the Auth Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is logged in when the app loads
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const user = authService.getUserFromStorage();
        
        if (user) {
          // Ensure role is only 'user' or 'admin', never 'artist'
          if (user.role && !['user', 'admin'].includes(user.role)) {
            console.warn('Invalid role detected, defaulting to user:', user.role);
            user.role = 'user';
          }
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          // Set admin status if user has admin role
          setIsAdmin(user.role === 'admin');
          console.log("User authenticated:", user);
          console.log("Is admin:", user.role === 'admin');
          console.log("Is artist:", user.isArtist); // Use isArtist field instead of role
        }
      } catch (error) {
        console.error('Authentication error:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Register function
  const register = async (username, email, password) => {
    try {
      const result = await authService.register({
        username,
        email,
        password
      });
      
      if (result.success) {
        // Ensure proper role handling
        const user = result.user;
        if (user.role && !['user', 'admin'].includes(user.role)) {
          user.role = 'user';
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin');
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      // For development/testing, simulate login with admin credentials
      if (email === 'admin@uncreated.com' && password === 'admin123') {
        const adminUser = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin', // Correct role
          isArtist: true, // Can be an artist but role is still admin
          profileImage: 'default-profile.jpg',
          token: 'simulated_token_123'
        };
        
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('token', 'simulated_token_123');
        
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        return { success: true, user: adminUser };
      }
      
      // Regular login flow
      const result = await authService.login({
        email, 
        password
      });
      
      if (result.success) {
        // Ensure proper role handling
        const user = result.user;
        if (user.role && !['user', 'admin'].includes(user.role)) {
          console.warn('Invalid role detected, defaulting to user:', user.role);
          user.role = 'user';
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    loading,
    user: currentUser // Add this for compatibility with existing code
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;