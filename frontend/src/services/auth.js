// frontend/src/services/auth.js - Enhanced with ban/pause support
import api from './api';

// Set user in local storage
const setUserData = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', userData.token);
};

// Remove user from local storage
const removeUserData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Get user from local storage
const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    if (response.data.success) {
      setUserData(response.data.user);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Registration failed' };
  }
};

// Enhanced login with ban/pause handling
export const login = async (credentials) => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    
    if (response.data.success) {
      setUserData(response.data.user);
      return response.data;
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Login error in service:', error);
    
    // Handle ban/pause responses (status 403)
    if (error.response?.status === 403 && error.response?.data?.accountStatus) {
      return {
        success: false,
        message: error.response.data.message,
        accountStatus: error.response.data.accountStatus
      };
    }
    
    // Handle other errors
    return { 
      success: false, 
      message: error.response?.data?.message || 'Invalid email or password' 
    };
  }
};

// Logout user
export const logout = () => {
  removeUserData();
  return { success: true, message: 'Logged out successfully' };
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/auth/profile');
    return response.data;
  } catch (error) {
    // Handle ban/pause responses
    if (error.response?.status === 403 && error.response?.data?.accountStatus) {
      return {
        success: false,
        message: error.response.data.message,
        accountStatus: error.response.data.accountStatus
      };
    }
    
    throw error.response?.data || { success: false, message: 'Failed to get user profile' };
  }
};

// NEW: Check account status (ban/pause)
export const checkAccountStatus = async () => {
  try {
    const response = await api.get('/api/auth/status');
    return response.data;
  } catch (error) {
    console.error('Error checking account status:', error);
    
    // If the status endpoint doesn't exist, try the profile endpoint
    try {
      const profileResponse = await api.get('/api/auth/profile');
      return {
        success: true,
        accountStatus: profileResponse.data.accountStatus || { allowed: true, status: 'active' }
      };
    } catch (profileError) {
      // If both fail, assume account is active
      return {
        success: true,
        accountStatus: { allowed: true, status: 'active' }
      };
    }
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// NEW: Handle API errors globally for ban/pause detection
export const handleApiError = (error) => {
  if (error.response?.status === 403 && error.response?.data?.accountStatus) {
    const accountStatus = error.response.data.accountStatus;
    
    // Notify the app about the ban/pause status
    window.dispatchEvent(new CustomEvent('accountStatusChanged', {
      detail: accountStatus
    }));
    
    return {
      isBanPause: true,
      accountStatus: accountStatus,
      message: error.response.data.message
    };
  }
  
  return {
    isBanPause: false,
    message: error.response?.data?.message || error.message || 'An error occurred'
  };
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  checkAccountStatus,
  isAuthenticated,
  getUserFromStorage,
  handleApiError
};