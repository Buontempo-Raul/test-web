// backend/routes/auctionPurchase.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const {
  getAuctionPurchase,
  updateShippingAddress,
  completePayment,
  updateShippingStatus
} = require('../controllers/auctionPurchaseController');
const { protect } = require('../middleware/authMiddleware');

// IMPORTANT: Specific routes MUST come before dynamic routes!

// Test route - ADDED
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auction purchases API is working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/auction-purchases/test - This test endpoint',
      'GET /api/auction-purchases/:auctionId - Get auction purchase',
      'PUT /api/auction-purchases/:auctionId/shipping - Update shipping',
      'POST /api/auction-purchases/:auctionId/payment - Complete payment',
      'PUT /api/auction-purchases/:auctionId/shipping-status - Update shipping status'
    ]
  });
});

// Debug route - ADDED to help with troubleshooting
router.get('/debug/:auctionId', async (req, res) => {
  try {
    const { auctionId } = req.params;
    const AuctionPurchase = require('../models/AuctionPurchase');
    
    // Find exact match
    const exactMatch = await AuctionPurchase.findOne({ auctionId });
    
    // Find similar matches (in case of typos)
    const similarMatches = await AuctionPurchase.find({
      auctionId: { $regex: auctionId.substring(0, 10), $options: 'i' }
    }).select('auctionId artwork winner status createdAt');
    
    // Get all purchases for debugging
    const allPurchases = await AuctionPurchase.find({})
      .select('auctionId artwork winner status createdAt')
      .populate('artwork', 'title')
      .populate('winner', 'username');
    
    res.json({
      success: true,
      debug: {
        searchedId: auctionId,
        exactMatch: exactMatch ? {
          found: true,
          id: exactMatch.auctionId,
          status: exactMatch.status
        } : { found: false },
        similarMatches: similarMatches.map(p => ({
          id: p.auctionId,
          similarity: p.auctionId.substring(0, 10) === auctionId.substring(0, 10)
        })),
        allPurchases: allPurchases.map(p => ({
          id: p.auctionId,
          artwork: p.artwork?.title || 'Unknown',
          winner: p.winner?.username || 'Unknown',
          status: p.status,
          created: p.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

// Public route (but data is filtered based on user)
// This MUST come after specific routes like /test and /debug
router.get('/:auctionId', getAuctionPurchase);

// Protected routes (require authentication)
router.put('/:auctionId/shipping', protect, updateShippingAddress);
router.post('/:auctionId/payment', protect, completePayment);
router.put('/:auctionId/shipping-status', protect, updateShippingStatus);

module.exports = router;