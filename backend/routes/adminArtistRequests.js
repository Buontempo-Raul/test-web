// backend/routes/adminArtistRequests.js
const express = require('express');
const router = express.Router();
const {
  getAllArtistRequests,
  getArtistRequest,
  approveArtistRequest,
  rejectArtistRequest,
  deleteArtistRequest,
  getArtistRequestStats
} = require('../controllers/artistRequestController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// @route   GET /api/admin/artist-requests/stats
// @desc    Get artist request statistics
// @access  Private/Admin
router.get('/stats', getArtistRequestStats);

// @route   GET /api/admin/artist-requests
// @desc    Get all artist requests with filtering
// @access  Private/Admin
router.get('/', getAllArtistRequests);

// @route   GET /api/admin/artist-requests/:requestId
// @desc    Get single artist request
// @access  Private/Admin
router.get('/:requestId', getArtistRequest);

// @route   PUT /api/admin/artist-requests/:requestId/approve
// @desc    Approve artist request
// @access  Private/Admin
router.put('/:requestId/approve', approveArtistRequest);

// @route   PUT /api/admin/artist-requests/:requestId/reject
// @desc    Reject artist request
// @access  Private/Admin
router.put('/:requestId/reject', rejectArtistRequest);

// @route   DELETE /api/admin/artist-requests/:requestId
// @desc    Delete artist request (admin only)
// @access  Private/Admin
router.delete('/:requestId', deleteArtistRequest);

module.exports = router;