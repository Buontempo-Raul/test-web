// backend/controllers/authController.js - Enhanced with permanent ban prevention
const userService = require('../services/userService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Helper function to check user account status
const checkAccountStatus = (user) => {
  return user.getAccountStatus();
};

// @desc    Register new user with permanent ban prevention
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // IMPORTANT: Check if email is permanently banned
    const isEmailBanned = await User.isEmailPermanentlyBanned(email);
    if (isEmailBanned) {
      return res.status(403).json({
        success: false,
        message: 'This email address is not eligible for registration. If you believe this is an error, please contact support.',
        reason: 'email_permanently_banned'
      });
    }

    // Check if user already exists (for active accounts)
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });

    if (existingUser) {
      // If user exists and is permanently banned
      if (existingUser.permanentlyBanned) {
        return res.status(403).json({
          success: false,
          message: 'This email address is not eligible for registration. If you believe this is an error, please contact support.',
          reason: 'email_permanently_banned'
        });
      }
      
      // If user exists and is active
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase()
          ? 'Email already in use' 
          : 'Username already taken' 
      });
    }

    // Create new user
    const userData = {
      username,
      email: email.toLowerCase(),
      password,
      role: 'user' // Default role
    };

    const user = await userService.createUser(userData);

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isArtist: user.isArtist,
          profileImage: user.profileImage,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid user data' 
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user & get token with enhanced ban/pause enforcement
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      
      // Get detailed account status
      const accountStatus = checkAccountStatus(user);
      
      if (!accountStatus.allowed) {
        // Enhanced error messages based on restriction type
        let message = accountStatus.reason;
        let statusDetails = {
          status: accountStatus.status,
          restriction: accountStatus.restriction,
          isPermanentlyBanned: accountStatus.isPermanentlyBanned
        };

        if (accountStatus.status === 'banned') {
          if (accountStatus.isPermanentlyBanned) {
            message = `Your account has been permanently banned. ${accountStatus.reason}`;
          } else {
            const banEndsAt = accountStatus.until.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            message = `Your account is banned until ${banEndsAt}. Reason: ${accountStatus.reason}`;
          }
          statusDetails.banUntil = accountStatus.until;
          statusDetails.banReason = accountStatus.reason;
        } else if (accountStatus.status === 'paused') {
          const pauseEndsAt = accountStatus.until.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          message = `Your account is temporarily suspended until ${pauseEndsAt}. Reason: ${accountStatus.reason}`;
          statusDetails.pauseUntil = accountStatus.until;
          statusDetails.pauseReason = accountStatus.reason;
        }
        
        return res.status(403).json({
          success: false,
          message: message,
          accountStatus: statusDetails
        });
      }
      
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
      
      res.json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isArtist: user.isArtist,
          profileImage: user.profileImage,
          role: user.role,
          lastLogin: user.lastLogin,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user profile with account status check
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);
    
    // Check account status
    const accountStatus = checkAccountStatus(user);

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isArtist: user.isArtist,
        profileImage: user.profileImage,
        bio: user.bio,
        website: user.website,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      accountStatus: accountStatus
    });
  } catch (error) {
    res.status(error.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check account status
    const accountStatus = checkAccountStatus(user);
    if (!accountStatus.allowed) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change password: ' + accountStatus.reason,
        accountStatus: accountStatus
      });
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user is permanently banned
    if (user.permanentlyBanned) {
      return res.status(403).json({
        success: false,
        message: 'Password reset is not available for this account. Please contact support.',
        reason: 'account_permanently_banned'
      });
    }
    
    // Check if user is currently banned/paused
    const accountStatus = checkAccountStatus(user);
    if (!accountStatus.allowed && accountStatus.status !== 'inactive') {
      return res.status(403).json({
        success: false,
        message: `Password reset not available: ${accountStatus.reason}`,
        accountStatus: accountStatus
      });
    }
    
    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Save it to the user model with an expiration
    // 3. Send an email with a reset link
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link will be sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check current account status
// @route   GET /api/auth/status
// @access  Private
const checkAccountStatusEndpoint = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const accountStatus = checkAccountStatus(user);
    
    res.json({
      success: true,
      accountStatus: accountStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if email is banned (public endpoint for frontend validation)
// @route   POST /api/auth/check-email
// @access  Public
const checkEmailStatus = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const isEmailBanned = await User.isEmailPermanentlyBanned(email);
    
    res.json({
      success: true,
      isEmailBanned: isEmailBanned,
      message: isEmailBanned 
        ? 'This email address is not eligible for registration' 
        : 'Email is available for registration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
  forgotPassword,
  checkAccountStatusEndpoint,
  checkEmailStatus,
  checkAccountStatus // Export helper function for use in middleware
};