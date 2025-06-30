// backend/routes/posts.js - Updated with artwork linking functionality
const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  getUserPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  commentOnPost,
  deleteComment,
  getUserArtworks
} = require('../controllers/postController');
const { protect, isArtist } = require('../middleware/authMiddleware');
const { uploadPostMedia, uploadFilesToAzure } = require('../middleware/azureStorageMiddleware');

// NEW: Get user's artworks for linking to posts (requires artist authentication)
// PUT THIS ROUTE FIRST to avoid conflicts with /user/:userId
router.get('/user/artworks', protect, isArtist, getUserArtworks);

// Public routes (no authentication required)
router.get('/', getPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getUserPosts);

// Protected routes (require authentication)
router.post(
  '/',
  protect,
  uploadPostMedia.array('media', 10), // Allow up to 10 files
  uploadFilesToAzure('posts'),
  createPost
);

router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentOnPost);
router.delete('/:id/comment/:commentId', protect, deleteComment);

module.exports = router;