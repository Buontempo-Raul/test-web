// backend/routes/artworks.js - Fixed version with proper imports and routes
const express = require('express');
const router = express.Router();
const { 
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages,
  getUserPosts  // FIXED: Import the missing function
} = require('../controllers/artworkController');
const { protect, isArtist } = require('../middleware/authMiddleware');
const { uploadArtworkImages: uploadMiddleware, uploadFilesToAzure } = require('../middleware/azureStorageMiddleware');

// IMPORTANT: Put specific routes BEFORE parameterized routes to avoid conflicts

// Test route (keep for debugging)
router.get('/test/posts', protect, (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  console.log('User:', req.user.username);
  console.log('User ID:', req.user._id);
  console.log('Is Artist:', req.user.isArtist);
  
  res.json({
    success: true,
    message: 'Test route working!',
    user: {
      id: req.user._id,
      username: req.user.username,
      isArtist: req.user.isArtist
    }
  });
});

// FIXED: Get user's posts for linking to artworks - using controller function
router.get('/user/posts', protect, isArtist, getUserPosts);

// Image upload route
router.post('/upload', protect, isArtist, uploadMiddleware.array('images', 10), uploadFilesToAzure('artworks'), uploadArtworkImages);

// Public routes
router.get('/', getArtworks);
router.get('/:id', getArtworkById);

// Protected routes (require authentication and artist status)
router.post('/', protect, isArtist, createArtwork);
router.put('/:id', protect, isArtist, updateArtwork);
router.delete('/:id', protect, isArtist, deleteArtwork);

// Like route (requires authentication but not artist status)
router.post('/:id/like', protect, likeArtwork);

module.exports = router;