// backend/middleware/authMiddleware.js - Enhanced with Ban vs Pause differentiation
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to check user account status with different restriction levels
const checkAccountStatus = (user) => {
  const now = new Date();
  
  // Check if user is BANNED (Complete restriction)
  if (user.banUntil && user.banUntil > now) {
    return {
      allowed: false,
      level: 'TOTAL_BLOCK',
      status: 'banned',
      severity: 'high',
      message: `Account banned until ${user.banUntil.toLocaleDateString()}`,
      reason: user.banReason || 'Policy violation',
      banUntil: user.banUntil,
      allowedActions: [], // No actions allowed
      blockLevel: 'COMPLETE' // Complete platform block
    };
  }
  
  // Check if user is PAUSED (Limited restriction)
  if (user.pauseUntil && user.pauseUntil > now) {
    return {
      allowed: false,
      level: 'LIMITED_ACCESS',
      status: 'paused',
      severity: 'medium',
      message: `Account paused until ${user.pauseUntil.toLocaleDateString()}`,
      reason: user.pauseReason || 'Account under review',
      pauseUntil: user.pauseUntil,
      allowedActions: ['read', 'view', 'profile', 'security'], // Some actions allowed
      blockLevel: 'PARTIAL' // Partial restrictions
    };
  }
  
  // Check if user account is inactive
  if (!user.active) {
    return {
      allowed: false,
      level: 'DEACTIVATED',
      status: 'inactive',
      severity: 'low',
      message: 'Account deactivated',
      reason: 'Account deactivated',
      allowedActions: ['contact_support'],
      blockLevel: 'ADMIN'
    };
  }
  
  return {
    allowed: true,
    level: 'FULL_ACCESS',
    status: 'active',
    severity: 'none',
    allowedActions: ['all'],
    blockLevel: 'NONE'
  };
};

// Main protection middleware with differentiated enforcement
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔍 Auth token received');

      // DEVELOPMENT: Handle simulated admin token
      if (process.env.NODE_ENV !== 'production' && token === 'simulated_token_123') {
        console.log('✅ Using simulated admin token for development');
        req.user = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin',
          isArtist: true
        };
        return next();
      }

      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET not found in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('❌ User not found for token');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check account status with differentiated handling
      const accountStatus = checkAccountStatus(req.user);
      
      if (!accountStatus.allowed) {
        console.log(`🚫 Access denied - ${accountStatus.status.toUpperCase()}: ${req.user.username}`);
        
        // Different responses for different restriction types
        let statusCode = 403;
        let response = {
          success: false,
          message: accountStatus.message,
          accountStatus: accountStatus
        };

        // BANNED users - Complete block (403 Forbidden)
        if (accountStatus.status === 'banned') {
          statusCode = 403;
          response.restricted = 'BANNED';
          response.access_level = 'NONE';
          console.log(`🚫 BANNED user blocked: ${req.user.username}`);
        }
        // PAUSED users - Partial block (423 Locked)
        else if (accountStatus.status === 'paused') {
          statusCode = 423;
          response.restricted = 'PAUSED';
          response.access_level = 'LIMITED';
          response.allowed_actions = accountStatus.allowedActions;
          console.log(`⏸️ PAUSED user restricted: ${req.user.username}`);
        }
        // INACTIVE users - Admin block (451 Unavailable)
        else if (accountStatus.status === 'inactive') {
          statusCode = 451;
          response.restricted = 'INACTIVE';
          response.access_level = 'SUPPORT_ONLY';
          console.log(`🔒 INACTIVE user blocked: ${req.user.username}`);
        }

        return res.status(statusCode).json(response);
      }

      console.log('✅ User authenticated and active:', req.user.username);
      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      
      let errorMessage = 'Not authorized, token failed';
      if (error.name === 'JsonWebTokenError') {
        errorMessage = 'Invalid token format';
      } else if (error.name === 'TokenExpiredError') {
        errorMessage = 'Token has expired';
      }

      res.status(401).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Admin middleware - requires admin role
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted:', req.user.username);
    next();
  } else {
    console.log('❌ Admin access denied for user:', req.user?.username || 'unknown');
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Artist middleware - requires artist status
const isArtist = (req, res, next) => {
  if (req.user && req.user.isArtist) {
    console.log('✅ Artist access granted:', req.user.username);
    next();
  } else {
    console.log('❌ Artist access denied for user:', req.user?.username || 'unknown');
    res.status(403).json({
      success: false,
      message: 'Access denied. Artist privileges required.'
    });
  }
};

// NEW: Partial protection for paused users (allows some read operations)
const protectWithPausedAccess = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // DEVELOPMENT: Handle simulated admin token
      if (process.env.NODE_ENV !== 'production' && token === 'simulated_token_123') {
        req.user = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin',
          isArtist: true
        };
        return next();
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const accountStatus = checkAccountStatus(req.user);
      
      // Allow PAUSED users for read operations, block BANNED users
      if (accountStatus.status === 'banned' || accountStatus.status === 'inactive') {
        console.log(`🚫 ${accountStatus.status.toUpperCase()} user blocked from read access: ${req.user.username}`);
        return res.status(403).json({
          success: false,
          message: accountStatus.message,
          accountStatus: accountStatus
        });
      }

      if (accountStatus.status === 'paused') {
        console.log(`⏸️ PAUSED user allowed read access: ${req.user.username}`);
        req.accountStatus = accountStatus; // Attach for controller use
      }

      next();
    } catch (error) {
      console.error('❌ Partial auth error:', error.message);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// NEW: Security operations protection (allows password changes for paused users)
const protectSecurity = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (process.env.NODE_ENV !== 'production' && token === 'simulated_token_123') {
        req.user = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin',
          isArtist: true
        };
        return next();
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration error'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const accountStatus = checkAccountStatus(req.user);
      
      // Block only BANNED users from security operations
      if (accountStatus.status === 'banned') {
        console.log(`🚫 BANNED user blocked from security operations: ${req.user.username}`);
        return res.status(403).json({
          success: false,
          message: 'Security operations not available for banned accounts.',
          accountStatus: accountStatus
        });
      }

      // Allow PAUSED and INACTIVE users to perform security operations
      if (accountStatus.status === 'paused' || accountStatus.status === 'inactive') {
        console.log(`⚠️ ${accountStatus.status.toUpperCase()} user allowed security access: ${req.user.username}`);
        req.accountStatus = accountStatus;
      }

      next();
    } catch (error) {
      console.error('❌ Security auth error:', error.message);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (process.env.NODE_ENV !== 'production' && token === 'simulated_token_123') {
        req.user = {
          _id: 'admin123',
          username: 'admin',
          email: 'admin@uncreated.com',
          role: 'admin',
          isArtist: true
        };
        return next();
      }
      
      if (process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (req.user) {
          const accountStatus = checkAccountStatus(req.user);
          req.accountStatus = accountStatus;
          
          // For optional auth, even restricted users get their status attached
          console.log(`👤 Optional auth - User: ${req.user.username}, Status: ${accountStatus.status}`);
        }
      }
    } catch (error) {
      console.log('Optional auth failed, continuing without user:', error.message);
    }
  }
  
  next();
};

module.exports = {
  protect,
  admin,
  isArtist,
  protectWithPausedAccess,    // NEW: Allows paused users read access
  protectSecurity,            // NEW: Allows paused users security operations
  optionalAuth,
  checkAccountStatus
};