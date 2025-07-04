// backend/routes/users.js - UPDATED with public followers/following routes
const express = require('express');
const router = express.Router();
const { 
  getUserByUsername,
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateUser,
  deleteUser,
  makeUserArtist,
  getUserArtworks,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  uploadProfileImage,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getUserFollowers,  // NEW
  getUserFollowing   // NEW
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadProfileImage: uploadProfileImageMiddleware } = require('../middleware/azureStorageMiddleware');

// Optional authentication middleware - sets req.user if token is valid, but doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      
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
      
      // Verify real JWT token
      if (process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch (error) {
      // If token is invalid, just continue without setting req.user
      console.log('Optional auth failed, continuing without user:', error.message);
    }
  }
  
  next();
};

// IMPORTANT: More specific routes MUST come before generic routes!
// Put all specific routes BEFORE the /:username route

// Protected routes (logged in users) - MOVED UP
router.put('/profile', protect, updateUserProfile);

// Profile image upload route - MOVED UP
router.post(
  '/profile/upload',
  protect,
  uploadProfileImageMiddleware.single('profileImage'),
  uploadProfileImage
);

// Favorites routes - MOVED UP
router.get('/favorites', protect, getUserFavorites);
router.post('/favorites/:artworkId', protect, addToFavorites);
router.delete('/favorites/:artworkId', protect, removeFromFavorites);

// Follow/unfollow routes - MOVED UP
router.post('/follow/:userId', protect, followUser);
router.post('/unfollow/:userId', protect, unfollowUser);
router.get('/following', protect, getFollowing);
router.get('/followers', protect, getFollowers);

// Admin routes - MOVED UP (these need to be before /:username)
router.get('/', protect, admin, getAllUsers);
router.get('/id/:userId', protect, admin, getUserById);
router.put('/:userId', protect, admin, updateUser);
router.delete('/:userId', protect, admin, deleteUser);
router.put('/:userId/artist', protect, admin, makeUserArtist);

// NEW: Public routes with username for followers/following - ADDED BEFORE /:username
router.get('/:username/followers', optionalAuth, getUserFollowers);
router.get('/:username/following', optionalAuth, getUserFollowing);

// FIXED: Public routes with username - MOVED TO BOTTOM
// These must be LAST because they use generic /:username parameter
router.get('/:username', getUserByUsername);
router.get('/:username/artworks', getUserArtworks);

module.exports = router;