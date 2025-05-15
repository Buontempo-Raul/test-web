// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile,
  changePassword,
  forgotPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;