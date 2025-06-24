// backend/routes/posts.js - Updated with better error handling
const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  deleteComment,
  getUserPosts
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { uploadPostMedia, uploadFilesToAzure } = require('../middleware/azureStorageMiddleware');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Get all posts with filtering
router.get('/', getPosts);

// Get user posts
router.get('/user/:userId', getUserPosts);

// Get a single post
router.get('/:id', getPostById);

// Create a post - requires authentication
router.post(
  '/',
  protect,                                 // Check authentication
  uploadPostMedia.array('media', 10),      // Parse files with multer (up to 10 files)
  handleMulterError,                       // Handle multer-specific errors
  uploadFilesToAzure('posts'),             // Upload to Azure and attach URLs
  createPost                               // Process the post creation
);

// Update a post - requires authentication
router.put(
  '/:id',
  protect,
  uploadPostMedia.array('media', 10),
  handleMulterError,
  uploadFilesToAzure('posts'),
  updatePost
);

// Delete a post - requires authentication
router.delete('/:id', protect, deletePost);

// Like a post - requires authentication
router.post('/:id/like', protect, likePost);

// Comment on a post - requires authentication
router.post('/:id/comment', protect, commentOnPost);

// Delete a comment - requires authentication
router.delete('/:id/comment/:commentId', protect, deleteComment);

module.exports = router;