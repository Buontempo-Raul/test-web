// backend/routes/artistRequests.js
const express = require('express');
const router = express.Router();
const {
  createArtistRequest,
  getUserArtistRequest,
  updateArtistRequest,
  deleteArtistRequest
} = require('../controllers/artistRequestController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/artist-requests
// @desc    Create new artist request
// @access  Private
router.post('/', protect, createArtistRequest);

// @route   GET /api/artist-requests/me
// @desc    Get user's own artist request
// @access  Private
router.get('/me', protect, getUserArtistRequest);

// @route   PUT /api/artist-requests/:requestId
// @desc    Update artist request (before review)
// @access  Private
router.put('/:requestId', protect, updateArtistRequest);

// @route   DELETE /api/artist-requests/:requestId
// @desc    Delete artist request
// @access  Private
router.delete('/:requestId', protect, deleteArtistRequest);

module.exports = router;