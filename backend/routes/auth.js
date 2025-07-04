// backend/routes/auth.js - Updated with email check endpoint
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  changePassword,
  forgotPassword,
  checkAccountStatusEndpoint,
  checkEmailStatus
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// NEW: Check if email is banned (public endpoint for frontend validation)
router.post('/check-email', checkEmailStatus);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);

// Account status check endpoint
router.get('/status', protect, checkAccountStatusEndpoint);

module.exports = router;