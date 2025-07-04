// backend/routes/posts.js - FIXED with optional authentication
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

// NEW: Get user's artworks for linking to posts (requires artist authentication)
// PUT THIS ROUTE FIRST to avoid conflicts with /user/:userId
router.get('/user/artworks', protect, isArtist, getUserArtworks);

// FIXED: Public routes with optional authentication for following filter
router.get('/', optionalAuth, getPosts); // Now can access req.user if logged in
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