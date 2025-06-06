// backend/routes/posts.js
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
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Get all posts with filtering
router.get('/', getPosts);

// Get user posts
router.get('/user/:userId', getUserPosts);

// Get a single post
router.get('/:id', getPostById);

// Create a post - requires authentication
router.post(
  '/',
  protect,
  uploadMiddleware.array('media', 10), // Allow up to 10 files for carousel
  uploadMiddleware.handleMulterError,
  createPost
);

// Update a post - requires authentication
router.put(
  '/:id',
  protect,
  uploadMiddleware.array('media', 10),
  uploadMiddleware.handleMulterError,
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