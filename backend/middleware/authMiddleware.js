// backend/middleware/authMiddleware.js
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

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Check if user is artist
const isArtist = (req, res, next) => {
  if (req.user && req.user.isArtist) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as an artist'
    });
  }
};

// Check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
};

module.exports = { protect, isArtist, admin };