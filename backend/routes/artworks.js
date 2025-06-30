// backend/routes/artworks.js - Debug version with test endpoint
const express = require('express');
const router = express.Router();
const { 
  getArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  likeArtwork,
  uploadArtworkImages
} = require('../controllers/artworkController');
const { protect, isArtist } = require('../middleware/authMiddleware');
const { uploadArtworkImages: uploadMiddleware, uploadFilesToAzure } = require('../middleware/azureStorageMiddleware');
const Artwork = require('../models/Artwork');
const Post = require('../models/Post');

// IMPORTANT: Put specific routes BEFORE parameterized routes to avoid conflicts

// TEST ROUTE: Simple test to verify routing works
router.get('/test/posts', protect, (req, res) => {
  console.log('=== TEST ROUTE HIT ===');
  console.log('User:', req.user.username);
  console.log('User ID:', req.user._id);
  console.log('Is Artist:', req.user.isArtist);
  
  res.json({
    success: true,
    message: 'Test route working!',
    user: {
      id: req.user._id,
      username: req.user.username,
      isArtist: req.user.isArtist
    }
  });
});

// ACTUAL ROUTE: Get user's posts for linking to artworks
router.get('/user/posts', protect, isArtist, async (req, res) => {
  try {
    console.log('=== getUserPosts called ===');
    console.log('User ID:', req.user._id);
    console.log('User isArtist:', req.user.isArtist);
    
    const posts = await Post.find({ creator: req.user._id })
      .select('_id content caption createdAt linkedShopItem')
      .sort({ createdAt: -1 })
      .populate('linkedShopItem', 'title');

    console.log('Posts found:', posts.length);
    console.log('Posts:', posts.map(p => ({ 
      id: p._id, 
      caption: p.caption, 
      hasLinkedItem: !!p.linkedShopItem,
      createdAt: p.createdAt
    })));

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload artwork images (must be before /:id route)
router.post(
  '/upload', 
  protect, 
  isArtist, 
  uploadMiddleware.array('images', 5),
  uploadFilesToAzure('artworks'),
  uploadArtworkImages
);

// Get all artworks
router.get('/', getArtworks);

// Create new artwork
router.post('/', protect, isArtist, createArtwork);

// Get single artwork (AFTER specific routes to avoid conflicts)
router.get('/:id', getArtworkById);

// Update artwork
router.put('/:id', protect, updateArtwork);

// Update artwork with images
router.put(
  '/:id/upload',
  protect,
  uploadMiddleware.array('images', 5),
  uploadFilesToAzure('artworks'),
  updateArtwork
);

// Delete artwork
router.delete('/:id', protect, deleteArtwork);

// Like artwork
router.post('/:id/like', protect, likeArtwork);

// **Place a bid on an artwork**
router.post('/:id/bid', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const artworkId = req.params.id;
    const bidderId = req.user._id;

    console.log('Placing bid:', { artworkId, amount, bidderId: bidderId.toString() });

    // Validate bid amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid bid amount is required'
      });
    }

    // Find artwork and populate creator
    const artwork = await Artwork.findById(artworkId).populate('creator', 'username');

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    if (!artwork.forSale) {
      return res.status(400).json({
        success: false,
        message: 'This artwork is not for sale'
      });
    }

    if (artwork.isSold) {
      return res.status(400).json({
        success: false,
        message: 'This artwork has already been sold'
      });
    }

    // Check if bidder is the artwork owner
    if (artwork.creator._id.toString() === bidderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot bid on your own artwork'
      });
    }

    // Get current highest bid
    const currentHighest = artwork.currentBid || artwork.price;
    const minimumBid = currentHighest + 5; // $5 minimum increment

    console.log('Bid validation:', { currentHighest, minimumBid, amount });

    if (amount < minimumBid) {
      return res.status(400).json({
        success: false,
        message: `Bid must be at least $${minimumBid.toFixed(2)}.`
      });
    }

    // Update artwork with new bid
    artwork.currentBid = amount;
    artwork.highestBidder = bidderId;

    // Add bid to auction if it exists
    if (artwork.auction) {
      artwork.auction.currentBid = amount;
      artwork.auction.highestBidder = bidderId;
      artwork.auction.bids.push({
        bidder: bidderId,
        amount: amount,
        timestamp: new Date()
      });
    }

    await artwork.save();

    // Populate and return updated artwork
    const updatedArtwork = await Artwork.findById(artworkId)
      .populate('creator', 'username profileImage')
      .populate('highestBidder', 'username');

    res.json({
      success: true,
      message: 'Bid placed successfully',
      artwork: updatedArtwork,
      newBid: {
        amount,
        bidder: req.user.username
      }
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// **Get bid history for an artwork**
router.get('/:id/bids', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate({
        path: 'auction.bids.bidder',
        select: 'username profileImage'
      });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    const bids = artwork.auction ? artwork.auction.bids : [];

    res.json({
      success: true,
      bids: bids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Latest first
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bid history'
    });
  }
});

module.exports = router;