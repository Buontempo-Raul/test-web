// backend/routes/users.js - Fix the import and route configuration

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

// Public routes
router.get('/:username', getUserByUsername);
router.get('/:username/artworks', getUserArtworks);

// Protected routes (logged in users)
router.put('/profile', protect, updateUserProfile);

// Fixed profile image upload route
router.post(
  '/profile/upload',
  protect,
  uploadProfileImageMiddleware.single('profileImage'), // Use the correct middleware
  uploadProfileImage
);

router.get('/favorites', protect, getUserFavorites);
router.post('/favorites/:artworkId', protect, addToFavorites);
router.delete('/favorites/:artworkId', protect, removeFromFavorites);
router.post('/follow/:userId', protect, followUser);
router.post('/unfollow/:userId', protect, unfollowUser);
router.get('/following', protect, getFollowing);
router.get('/followers', protect, getFollowers);

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.get('/id/:userId', protect, admin, getUserById);
router.put('/:userId', protect, admin, updateUser);
router.delete('/:userId', protect, admin, deleteUser);
router.put('/:userId/artist', protect, admin, makeUserArtist);

module.exports = router;