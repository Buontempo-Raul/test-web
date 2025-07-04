import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/auth';

// Create the Auth Context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountStatus, setAccountStatus] = useState({ allowed: true, status: 'active' });

  // Helper function to handle account status
  const handleAccountStatus = (user, status = null) => {
    if (status) {
      setAccountStatus(status);
      
      // If account is not allowed, we keep user data but mark as restricted
      if (!status.allowed) {
        console.log(`Account ${status.status}:`, status.message);
        return false; // Not allowed to use the app
      }
    }
    
    setAccountStatus({ allowed: true, status: 'active' });
    return true; // Allowed to use the app
  };

  // Check if user is logged in when the app loads
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const user = authService.getUserFromStorage();
        
        if (user) {
          // Ensure role is only 'user' or 'admin'
          if (user.role && !['user', 'admin'].includes(user.role)) {
            console.warn('Invalid role detected, defaulting to user:', user.role);
            user.role = 'user';
          }
          
          // Check current account status with the backend
          try {
            const statusResponse = await authService.checkAccountStatus();
            if (statusResponse.success) {
              const isAllowed = handleAccountStatus(user, statusResponse.accountStatus);
              
              if (isAllowed) {
                setCurrentUser(user);
                setIsAuthenticated(true);
                setIsAdmin(user.role === 'admin');
                console.log("User authenticated:", user);
              } else {
                // User is banned/paused - keep user data but restrict access
                setCurrentUser(user);
                setIsAuthenticated(false); // Prevent app usage
                setIsAdmin(false);
                console.log("User restricted:", statusResponse.accountStatus);
              }
            } else {
              // If status check fails, treat as regular auth
              setCurrentUser(user);
              setIsAuthenticated(true);
              setIsAdmin(user.role === 'admin');
            }
          } catch (statusError) {
            console.warn('Account status check failed, proceeding with cached user:', statusError);
            setCurrentUser(user);
            setIsAuthenticated(true);
            setIsAdmin(user.role === 'admin');
          }
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
        const user = result.user;
        if (user.role && !['user', 'admin'].includes(user.role)) {
          user.role = 'user';
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin');
        setAccountStatus({ allowed: true, status: 'active' });
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  // Enhanced login function with ban/pause handling
  const login = async (email, password) => {
    try {
      // For development/testing, simulate login with admin credentials
      if (email === 'admin@uncreated.com' && password === 'admin123') {
        const adminUser = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin',
          isArtist: true,
          profileImage: 'default-profile.jpg',
          token: 'simulated_token_123'
        };
        
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('token', 'simulated_token_123');
        
        setCurrentUser(adminUser);
        setIsAuthenticated(true);
        setIsAdmin(true);
        setAccountStatus({ allowed: true, status: 'active' });
        
        return { success: true, user: adminUser };
      }
      
      // Regular login flow
      const result = await authService.login({
        email, 
        password
      });
      
      if (result.success) {
        const user = result.user;
        if (user.role && !['user', 'admin'].includes(user.role)) {
          console.warn('Invalid role detected, defaulting to user:', user.role);
          user.role = 'user';
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsAdmin(user.role === 'admin');
        setAccountStatus({ allowed: true, status: 'active' });
      } else if (result.accountStatus) {
        // Handle ban/pause on login attempt
        setCurrentUser({
          username: email.split('@')[0], // Fallback username
          email: email
        });
        setIsAuthenticated(false);
        setIsAdmin(false);
        setAccountStatus(result.accountStatus);
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
    setAccountStatus({ allowed: true, status: 'active' });
  };

  // Function to refresh account status
  const refreshAccountStatus = async () => {
    try {
      const user = authService.getUserFromStorage();
      if (user) {
        const statusResponse = await authService.checkAccountStatus();
        if (statusResponse.success) {
          const isAllowed = handleAccountStatus(user, statusResponse.accountStatus);
          
          if (isAllowed && !isAuthenticated) {
            // User was banned/paused but now is active again
            setCurrentUser(user);
            setIsAuthenticated(true);
            setIsAdmin(user.role === 'admin');
          } else if (!isAllowed && isAuthenticated) {
            // User was active but now is banned/paused
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing account status:', error);
    }
  };

  // Function to check if user can perform actions
  const canPerformAction = (action = 'general') => {
    if (!isAuthenticated || !accountStatus.allowed) {
      return false;
    }
    
    // Additional checks can be added here for specific actions
    return true;
  };

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    accountStatus,
    login,
    register,
    logout,
    loading,
    refreshAccountStatus,
    canPerformAction,
    user: currentUser // Add this for compatibility with existing code
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;