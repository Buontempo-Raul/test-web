// backend/routes/users.js - FIXED: Correct route order to prevent conflicts
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
  getFollowers
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadProfileImage: uploadProfileImageMiddleware } = require('../middleware/azureStorageMiddleware');

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

// FIXED: Public routes with username - MOVED TO BOTTOM
// These must be LAST because they use generic /:username parameter
router.get('/:username', getUserByUsername);
router.get('/:username/artworks', getUserArtworks);

module.exports = router;