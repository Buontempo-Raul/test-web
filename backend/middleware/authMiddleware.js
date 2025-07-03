// Fixed Auth Middleware - backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token and set user
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('🔍 Auth token received:', token);

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

      // Verify real JWT token
      if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET not found in environment variables');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error - JWT_SECRET missing'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT decoded:', decoded);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('❌ User not found for token');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User authenticated:', req.user.username);
      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      
      // Provide more specific error messages
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
  } else {
    console.log('❌ No authorization header found');
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Check if user is artist
const isArtist = (req, res, next) => {
  console.log('🎨 Checking artist status for user:', req.user?.username);
  
  if (req.user && req.user.isArtist) {
    console.log('✅ User is an artist');
    next();
  } else {
    console.log('❌ User is not an artist');
    res.status(403).json({
      success: false,
      message: 'Not authorized as an artist'
    });
  }
};

// Check if user is admin
const admin = (req, res, next) => {
  console.log('👑 Checking admin status for user:', req.user?.username);
  console.log('👑 User role:', req.user?.role);
  
  if (req.user && req.user.role === 'admin') {
    console.log('✅ User is an admin');
    next();
  } else {
    console.log('❌ User is not an admin - Access denied');
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
      debug: {
        userRole: req.user?.role,
        isAdmin: req.user?.role === 'admin'
      }
    });
  }
};

module.exports = { protect, isArtist, admin };