// backend/routes/admin.js - Updated with enhanced ban/pause functionality
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
  fullyRestoreUser,
  deletePost,
  deleteArtwork,
  stopAuction
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// Test route (no auth required for debugging)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/admin/dashboard/stats - Dashboard statistics',
      'GET /api/admin/dashboard/activity - Recent activity',
      'GET /api/admin/users - User management',
      'PUT /api/admin/users/:userId/ban - Ban/unban user (permanent email ban)',
      'PUT /api/admin/users/:userId/pause - Pause/unpause user (temporary)',
      'PUT /api/admin/users/:userId/restore - Fully restore user (remove permanent ban)',
      'GET /api/admin/posts - Post management',
      'GET /api/admin/artworks - Artwork management',
      'GET /api/admin/auctions - Auction management',
      'PUT /api/admin/auctions/:artworkId/stop - Stop auction (admin only)'  // Add this line
    ]
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

// Enhanced user action routes
router.put('/users/:userId/ban', banUser);        // Ban user (permanent email ban)
router.put('/users/:userId/pause', pauseUser);    // Pause user (temporary restriction)
router.put('/users/:userId/restore', fullyRestoreUser); // NEW: Fully restore user
router.put('/auctions/:artworkId/stop', stopAuction);  // NEW: Stop auction route


// Content management routes
router.delete('/posts/:postId', deletePost);
router.delete('/artworks/:artworkId', deleteArtwork);

module.exports = router;