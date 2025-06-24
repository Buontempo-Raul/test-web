// backend/routes/auctions.js
const express = require('express');
const router = express.Router();
const {
  placeBid,
  getBidHistory,
  getAuctionInfo
} = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/:artworkId/info', getAuctionInfo);
router.get('/:artworkId/bids', getBidHistory);

// Protected routes (authenticated users)
router.post('/:artworkId/bid', protect, placeBid);

module.exports = router;