// backend/routes/auctions.js - Updated with start/end routes
const express = require('express');
const router = express.Router();
const {
  placeBid,
  startAuction,
  endAuction,
  getBidHistory,
  getAuctionInfo
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/:artworkId/info', getAuctionInfo);
router.get('/:artworkId/bids', getBidHistory);

// Protected routes (authenticated users)
router.post('/:artworkId/bid', protect, placeBid);

// NEW: Artist-only routes for managing auctions
router.post('/:artworkId/start', protect, startAuction);
router.post('/:artworkId/end', protect, endAuction);

module.exports = router;