// backend/routes/auctionPurchases.js
const express = require('express');
const router = express.Router();
const {
  getAuctionPurchase,
  updateShippingAddress,
  completePayment,
  updateShippingStatus
} = require('../controllers/auctionPurchaseController');
const { protect } = require('../middleware/authMiddleware');

// Public route (but data is filtered based on user)
router.get('/:auctionId', getAuctionPurchase);

// Protected routes (require authentication)
router.put('/:auctionId/shipping', protect, updateShippingAddress);
router.post('/:auctionId/payment', protect, completePayment);
router.put('/:auctionId/shipping-status', protect, updateShippingStatus);

module.exports = router;