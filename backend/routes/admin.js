const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRecentActivity,
  getAllUsers,
  getAllPosts,
  getAllArtworks,
  getAllAuctions,
  banUser,
  pauseUser,
  deletePost,
  deleteArtwork
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Test route (no auth required for debugging)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes working!',
    timestamp: new Date().toISOString()
  });
});

// All other routes require admin auth
router.use(protect);
router.use(admin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getRecentActivity);

// Management routes
router.get('/users', getAllUsers);
router.get('/posts', getAllPosts);
router.get('/artworks', getAllArtworks);
router.get('/auctions', getAllAuctions);

// Action routes
router.put('/users/:userId/ban', banUser);
router.put('/users/:userId/pause', pauseUser);
router.delete('/posts/:postId', deletePost);
router.delete('/artworks/:artworkId', deleteArtwork);

module.exports = router;